#!/usr/bin/env python3
"""
Автоматическая обработка дат релизов в releases.html
Преобразует ID формата YYYYMMDDHH в локализованные даты.
"""

import re
from pathlib import Path
import argparse
from datetime import datetime

class ReleaseDateProcessor:
    """Обработчик дат в releases.html."""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.stats = {'processed': 0, 'modified': 0}

    def parse_release_id(self, release_id):
        """Парсит ID релиза в datetime объект."""
        if '.' in release_id:
            # Формат YYYY.MM.DD.HH
            parts = release_id.split('.')
            if len(parts) >= 4:
                year, month, day, hour = map(int, parts[:4])
                return datetime(year, month, day, hour)
        else:
            # Формат YYYYMMDDHH
            if len(release_id) >= 8:
                year = int(release_id[:4])
                month = int(release_id[4:6])
                day = int(release_id[6:8])
                hour = int(release_id[8:10]) if len(release_id) >= 10 else 0
                return datetime(year, month, day, hour)
        return None

    def process_file(self, filepath):
        """Обрабатывает releases.html файл."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original = content

            # Находим все ID релизов в оглавлении
            def replace_toc(match):
                release_id = match.group(1)
                dt = self.parse_release_id(release_id)
                if dt:
                    # Заменяем ID на форматированную дату
                    return f'<a href="#{release_id}">{dt.strftime("%Y-%m-%d %H:%M")}</a>'
                return match.group(0)

            # Заменяем в оглавлении
            content = re.sub(
                r'<a href="#([^"]+)">([^<]+)</a>',
                replace_toc,
                content
            )

            # Находим и заменяем заголовки статей
            def replace_heading(match):
                release_id = match.group(1)
                dt = self.parse_release_id(release_id)
                if dt:
                    # Сохраняем ID для ссылки, но показываем дату
                    formatted_date = dt.strftime("%Y-%m-%d %H:%M")
                    return f'<h3><a href="#{release_id}">{formatted_date}</a></h3>'
                return match.group(0)

            content = re.sub(
                r'<h3><a href="#([^"]+)">([^<]+)</a></h3>',
                replace_heading,
                content
            )

            if content != original:
                self.stats['modified'] += 1
                if not self.dry_run:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                print(f"  ✓ Modified: {filepath}")
            else:
                print(f"  - Unchanged: {filepath}")

            self.stats['processed'] += 1

        except Exception as e:
            print(f"  ✗ Error: {e}")

    def process_directory(self, directory):
        """Обрабатывает все releases.html файлы."""
        directory = Path(directory)

        # Ищем releases.html во всех языковых папках
        for lang in ['en', 'de', 'fr', 'es', 'ru']:
            releases_file = directory / lang / 'releases.html'
            if releases_file.exists():
                print(f"\nProcessing {lang}/releases.html")
                self.process_file(releases_file)

    def print_stats(self):
        """Выводит статистику."""
        print("\n" + "=" * 50)
        print("STATISTICS:")
        print(f"  Files processed: {self.stats['processed']}")
        print(f"  Files modified: {self.stats['modified']}")


def main():
    parser = argparse.ArgumentParser(
        description='Process release dates in releases.html files'
    )
    parser.add_argument('path', help='Path to static-tmp directory')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without writing files')

    args = parser.parse_args()

    processor = ReleaseDateProcessor(dry_run=args.dry_run)
    processor.process_directory(args.path)
    processor.print_stats()


if __name__ == '__main__':
    main()