#!/usr/bin/env python3
"""
Автоматическая локализация контента в HTML файлах.
Находит даты, числа, размеры и заменяет их на вызовы функций форматирования.
"""

import re
import os
from pathlib import Path
from datetime import datetime
import argparse

class ContentLocalizer:
    """Класс для автоматической локализации контента в HTML файлах."""

    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.stats = {'files_processed': 0, 'replacements': 0}

        # Регулярные выражения для поиска
        self.patterns = [
            # Даты в формате Month YYYY (January 2024, March 2033)
            (r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b',
             self._replace_date_month_year),

            # Даты в формате YYYY-MM-DD или YYYY/MM/DD
            (r'\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b',
             self._replace_date_iso),

            # Даты в формате DD Month YYYY (31 December 2024)
            (r'\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b',
             self._replace_date_day_month_year),

            # Размеры в GiB/GB/MB/KB (136GiB, 32GB, 512MB, 64KB)
            (r'\b(\d+(?:\.\d+)?)\s*(GiB|GB|MB|KB|MiB)\b',
             self._replace_size),

            # Цены в USD ($5, $5,000, $1,234.56)
            (r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\b',
             self._replace_currency_usd),

            # Числа с разделителями тысяч (1,234,567) и без
            (r'\b(\d{1,3}(?:,\d{3})+(?:\.\d+)?)\b',
             self._replace_number_with_commas),

            # Годы (2024, 2025, 2026) - только если они не в составе других паттернов
            (r'\b(19|20)\d{2}\b',
             self._replace_year),

            # Версии (Android 16, Android 15) - не трогаем
            # Количества с единицами (7 years, 5 years, 3 months)
            (r'\b(\d+)\s+(year|years|month|months|day|days|hour|hours)\b',
             self._replace_duration),
        ]

    def _replace_date_month_year(self, match):
        """Заменяет даты в формате 'Month YYYY'."""
        month_name = match.group(1)
        year = match.group(2)
        month_num = self._month_to_number(month_name)
        return f'{{{{ format_date("{year}-{month_num:02d}-01", "MMMM yyyy") }}}}'

    def _replace_date_iso(self, match):
        """Заменяет даты в формате YYYY-MM-DD."""
        year, month, day = match.groups()
        return f'{{{{ format_date("{year}-{month:02d}-{day:02d}", "medium") }}}}'

    def _replace_date_day_month_year(self, match):
        """Заменяет даты в формате 'DD Month YYYY'."""
        day, month_name, year = match.groups()
        month_num = self._month_to_number(month_name)
        return f'{{{{ format_date("{year}-{month_num:02d}-{int(day):02d}", "long") }}}}'

    def _replace_size(self, match):
        """Заменяет размеры (136GiB, 32GB)."""
        value = match.group(1)
        unit = match.group(2)

        # Конвертируем в байты для format_size
        multiplier = {'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3,
                      'GiB': 1024**3, 'MiB': 1024**2, 'KiB': 1024}

        bytes_value = float(value) * multiplier.get(unit, 1)

        # Для целых чисел используем 0 десятичных знаков
        decimals = 0 if '.' not in value else 1

        return f'{{{{ format_size({int(bytes_value)}, {decimals}) }}}}'

    def _replace_currency_usd(self, match):
        """Заменяет цены в USD ($5, $5,000)."""
        amount_str = match.group(1).replace(',', '')
        try:
            amount = float(amount_str)
            # Целые числа без десятичных
            if amount == int(amount):
                return f'{{{{ format_currency({int(amount)}, "USD") }}}}'
            else:
                return f'{{{{ format_currency({amount}, "USD") }}}}'
        except:
            return match.group(0)

    def _replace_number_with_commas(self, match):
        """Заменяет числа с разделителями тысяч."""
        num_str = match.group(1).replace(',', '')
        try:
            num = float(num_str)
            if num == int(num):
                return f'{{{{ format_number({int(num)}) }}}}'
            else:
                return f'{{{{ format_number({num}) }}}}'
        except:
            return match.group(0)

    def _replace_year(self, match):
        """Заменяет года на форматированные."""
        year = match.group(0)
        # Не заменяем года в ID (#2026032000) или в ссылках
        # Проверяем контекст
        return f'{{{{ format_number({year}, 0) }}}}'

    def _replace_duration(self, match):
        """Заменяет длительности (7 years, 5 months)."""
        number = match.group(1)
        unit = match.group(2)

        # Определяем singular/plural
        if unit in ['year', 'years']:
            singular = 'year'
            plural = 'years'
        elif unit in ['month', 'months']:
            singular = 'month'
            plural = 'months'
        elif unit in ['day', 'days']:
            singular = 'day'
            plural = 'days'
        elif unit in ['hour', 'hours']:
            singular = 'hour'
            plural = 'hours'
        else:
            return match.group(0)

        return f'{{{{ ngettext("{singular}", "{plural}", {number}) }}}}'

    def _month_to_number(self, month_name):
        """Преобразует название месяца в номер."""
        months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        }
        return months.get(month_name, 1)

    def _should_skip_line(self, line):
        """Проверяет, нужно ли пропустить строку."""
        skip_patterns = [
            r'<\s*pre',           # внутри pre
            r'<\s*code',          # внутри code
            r'<\s*script',        # внутри script
            r'id="[^"]*"',        # в id атрибутах
            r'href="[^"]*"',      # в ссылках
            r'src="[^"]*"',       # в src
            r'{{.*}}',            # уже содержит шаблоны
            r'{%',                # уже содержит шаблоны
        ]

        for pattern in skip_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                return True
        return False

    def process_file(self, filepath):
        """Обрабатывает один HTML файл."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            original = content
            lines = content.split('\n')
            modified_lines = []

            in_code_block = False

            for line in lines:
                # Проверяем начало/конец блоков кода
                if '<pre' in line or '<code' in line:
                    in_code_block = True
                elif '</pre>' in line or '</code>' in line:
                    in_code_block = False

                # Пропускаем блоки кода
                if in_code_block or self._should_skip_line(line):
                    modified_lines.append(line)
                    continue

                # Применяем все паттерны
                for pattern, replacer in self.patterns:
                    line = re.sub(pattern, replacer, line, flags=re.IGNORECASE)

                modified_lines.append(line)

            modified_content = '\n'.join(modified_lines)

            if modified_content != original:
                self.stats['replacements'] += 1
                if not self.dry_run:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(modified_content)
                print(f"  ✓ Modified: {filepath}")
            else:
                print(f"  - Unchanged: {filepath}")

            self.stats['files_processed'] += 1

        except Exception as e:
            print(f"  ✗ Error processing {filepath}: {e}")

    def process_directory(self, directory):
        """Обрабатывает все HTML файлы в директории."""
        directory = Path(directory)
        html_files = list(directory.rglob('*.html'))

        print(f"\nFound {len(html_files)} HTML files to process")
        print("-" * 50)

        for filepath in html_files:
            # Пропускаем файлы в языковых папках
            if any(part in ['en', 'de', 'fr', 'es', 'ru'] for part in filepath.parts):
                continue
            self.process_file(filepath)

    def print_stats(self):
        """Выводит статистику."""
        print("\n" + "=" * 50)
        print("STATISTICS:")
        print(f"  Files processed: {self.stats['files_processed']}")
        print(f"  Files modified: {self.stats['replacements']}")


def main():
    parser = argparse.ArgumentParser(
        description='Automatically localize dates, numbers, and currencies in HTML files'
    )
    parser.add_argument('path', help='Path to file or directory')
    parser.add_argument('--dry-run', action='store_true',
                        help='Preview changes without writing files')

    args = parser.parse_args()

    localizer = ContentLocalizer(dry_run=args.dry_run)

    path = Path(args.path)
    if path.is_file():
        localizer.process_file(path)
    elif path.is_dir():
        localizer.process_directory(path)
    else:
        print(f"Error: {path} does not exist")
        return

    localizer.print_stats()


if __name__ == '__main__':
    main()