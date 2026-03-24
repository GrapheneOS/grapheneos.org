#!/usr/bin/env python3
"""
Script to wrap text in HTML files with _("text")
Usage: python wrap_text_in_files.py <path_to_file_or_directory>
"""

import os
import sys
import argparse
import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Doctype, Comment, CData


class HTMLTextWrapper:
    """Class for wrapping text in HTML files"""

    def __init__(self, preserve_formatting=True):
        self.preserve_formatting = preserve_formatting
        self.files_processed = 0
        self.files_modified = 0
        self.errors = []
        # Regular expressions for skipping special constructs
        self.template_patterns = [
            r'\{\{.*?\}\}',      # {{ variable }}
            r'\{\%.*?\%\}',      # {% statement %}
            r'\{\#.*?\#\}',      # {# comment #}
            r'\[\[.*?\]\]',      # [[link]]
            r'<[^>]+>',          # HTML tags
        ]

    def should_skip_text(self, text):
        """Check if this text should be skipped"""
        # Skip empty text
        if not text or text.isspace():
            return True

        # Skip text that starts with <! (doctype, etc.)
        if text.strip().startswith('<!'):
            return True

        # Check if text is a special construct
        for pattern in self.template_patterns:
            if re.search(pattern, text):
                return True

        # Skip text that contains only HTML entities
        if re.match(r'^&[a-z]+;$', text.strip()):
            return True

        return False

    def wrap_text_in_html(self, html_content):
        """Wrap text in HTML content"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            self._wrap_text_nodes(soup)
            # Convert back to string, preserving doctype
            return str(soup)
        except Exception as e:
            raise Exception(f"Error processing HTML: {e}")

    def _wrap_text_nodes(self, element):
        """Recursively wrap text nodes"""
        # Skip special node types
        if isinstance(element, (Doctype, Comment, CData)):
            return

        # Skip tags that should not be processed
        if hasattr(element, 'name') and element.name in ['script', 'style', 'code', 'pre', 'textarea']:
            return

        # Process child elements
        for child in list(element.children):
            if isinstance(child, NavigableString) and not isinstance(child, (Doctype, Comment, CData)):
                # This is a text node
                text = str(child)

                # Check if we should skip this text
                if self.should_skip_text(text):
                    continue

                # Check if text contains anything other than whitespace
                if text.strip() and not text.isspace():
                    # Escape quotes
                    escaped_text = text.replace('"', '\\"')
                    # Create wrapped text
                    wrapped = NavigableString(f'_("{escaped_text}")')
                    child.replace_with(wrapped)
            else:
                # This is an HTML element or special node, process recursively
                self._wrap_text_nodes(child)

    def process_file(self, file_path):
        """Process a single HTML file"""
        try:
            # Convert to string if it's a Path object
            file_path_str = str(file_path)

            # Read the file
            with open(file_path_str, 'r', encoding='utf-8') as f:
                original_content = f.read()

            # Process the content
            modified_content = self.wrap_text_in_html(original_content)

            # Check if changes were made
            if modified_content != original_content:
                # Write back to file
                with open(file_path_str, 'w', encoding='utf-8') as f:
                    f.write(modified_content)
                self.files_modified += 1
                print(f"  ✓ Modified: {file_path_str}")
            else:
                print(f"  - Unchanged: {file_path_str}")

            self.files_processed += 1

        except Exception as e:
            error_msg = f"Error processing {file_path}: {e}"
            self.errors.append(error_msg)
            print(f"  ✗ {error_msg}")

    def process_directory(self, directory_path, extensions=None):
        """Process all HTML files in a directory"""
        if extensions is None:
            extensions = {'.html', '.htm', '.xhtml', '.php', '.tpl', '.twig'}

        directory = Path(directory_path)

        if not directory.exists():
            raise Exception(f"Directory does not exist: {directory_path}")

        # Find all files with the specified extensions
        html_files = []
        for ext in extensions:
            html_files.extend(directory.rglob(f'*{ext}'))

        if not html_files:
            print(f"No HTML files found in {directory_path}")
            return

        print(f"Found {len(html_files)} files to process")
        print("-" * 50)

        # Process each file
        for file_path in html_files:
            self.process_file(file_path)

    def process_path(self, path):
        """Process a file or directory"""
        path_obj = Path(path)

        if not path_obj.exists():
            print(f"Error: path does not exist - {path}")
            return

        if path_obj.is_file():
            print(f"Processing file: {path}")
            print("-" * 50)
            self.process_file(path_obj)
        elif path_obj.is_dir():
            print(f"Processing directory: {path}")
            print("-" * 50)
            self.process_directory(path_obj)
        else:
            print(f"Error: unknown path type - {path}")

    def print_summary(self):
        """Print summary of the work performed"""
        print("-" * 50)
        print("Summary:")
        print(f"  Files processed: {self.files_processed}")
        print(f"  Files modified: {self.files_modified}")

        if self.errors:
            print(f"\nErrors ({len(self.errors)}):")
            for error in self.errors[:10]:
                print(f"  - {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more errors")


def main():
    parser = argparse.ArgumentParser(
        description='Wraps text in HTML files with _("text")',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Usage examples:
  %(prog)s index.html                    # Process a single file
  %(prog)s /path/to/directory            # Process all HTML files in a directory
  %(prog)s /path/to/directory --skip-tags script style # Skip specified tags
        """
    )

    parser.add_argument(
        'path',
        help='Path to file or directory'
    )

    parser.add_argument(
        '--skip-tags',
        nargs='+',
        default=['script', 'style', 'code', 'pre', 'textarea'],
        help='HTML tags to skip (default: script style code pre textarea)'
    )

    parser.add_argument(
        '--ext',
        nargs='+',
        default=['.html', '.htm', '.xhtml', '.php', '.tpl', '.twig'],
        help='File extensions to process (default: .html .htm .xhtml .php .tpl .twig)'
    )

    parser.add_argument(
        '--encoding',
        default='utf-8',
        help='File encoding (default: utf-8)'
    )

    args = parser.parse_args()

    # Create wrapper instance
    wrapper = HTMLTextWrapper(preserve_formatting=True)

    # Process the path
    try:
        wrapper.process_path(args.path)
        wrapper.print_summary()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()