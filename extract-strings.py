#!/usr/bin/env python3
"""
Извлекает строки для перевода из шаблонов и генерирует .pot файлы.
"""

import os
import re
import json
import subprocess
from pathlib import Path
from datetime import datetime

def check_babel():
    """Проверяет наличие pybabel."""
    try:
        result = subprocess.run(['pybabel', '--version'],
                                capture_output=True,
                                text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

def extract_from_templates():
    """Извлекает строки из шаблонов Jinja2."""

    # Используем pybabel для извлечения
    cmd = [
        'pybabel', 'extract',
        '-F', 'babel.cfg',
        '-o', 'messages.pot',
        '--project=GrapheneOS',
        '--version=1.0',
        '--copyright-holder=GrapheneOS',
        '--msgid-bugs-address=contact@grapheneos.org',
        '.'
    ]

    print("Extracting strings from templates...")
    subprocess.run(cmd, check=True)
    print("✓ messages.pot created")

def create_json_from_pot(pot_file='messages.pot'):
    """Создает JSON файлы из .pot для удобного редактирования."""

    import polib

    if not Path(pot_file).exists():
        print(f"✗ {pot_file} not found")
        return

    pot = polib.pofile(pot_file)

    # Создаем структуру для JSON
    strings = {}
    for entry in pot:
        if entry.msgid and not entry.msgid.startswith('_'):
            strings[entry.msgid] = {
                'msgid': entry.msgid,
                'msgstr': '',
                'comments': entry.comment,
                'occurrences': [f"{occ[0]}:{occ[1]}" for occ in entry.occurrences]
            }

    # Сохраняем как JSON
    output_file = 'i18n/strings.json'
    Path('i18n').mkdir(exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(strings, f, ensure_ascii=False, indent=2)

    print(f"✓ Created {output_file} with {len(strings)} strings")

def init_language(lang):
    """Инициализирует перевод для нового языка."""

    cmd = [
        'pybabel', 'init',
        '-i', 'messages.pot',
        '-d', 'locale',
        '-l', lang,
        '--domain=grapheneos'
    ]

    print(f"Initializing {lang} translation...")
    subprocess.run(cmd, check=True)

    # Также создаем JSON шаблон
    lang_dir = Path(f'locale/{lang}/LC_MESSAGES')
    json_file = lang_dir / 'common.json'

    if not json_file.exists():
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({}, f, ensure_ascii=False, indent=2)
        print(f"✓ Created {json_file}")

def update_translations():
    """Обновляет существующие переводы."""

    if not check_babel():
        return False

    if not Path('messages.pot').exists():
        print("✗ messages.pot not found. Run extract first.")
        return False

    # Создаем директорию если нет
    Path('locale').mkdir(exist_ok=True)

    # Проверяем, есть ли уже .po файлы
    po_files = list(Path('locale').glob('**/*.po'))

    if not po_files:
        print("No .po files found. Run init first.")
        return True  # Не ошибка, просто нет файлов

    print(f"\n🔄 Updating {len(po_files)} translation files...")

    try:
        cmd = ['pybabel', 'update', '-i', 'messages.pot', '-d', 'locale', '--domain=grapheneos']
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"⚠️  Warning: {result.stderr}")
            return True  # Не прерываем сборку

        print("✓ Updated .po files")
        return True

    except Exception as e:
        print(f"⚠️  Error: {e}")
        return True  # Не прерываем сборку

def compile_translations():
    """Компилирует .po в .mo."""

    cmd = ['pybabel', 'compile', '-d', 'locale', '--domain=grapheneos']
    subprocess.run(cmd, check=True)
    print("✓ Compiled .mo files")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Manage i18n strings')
    parser.add_argument('command',
                        choices=['extract', 'init', 'update', 'compile', 'all'],
                        help='Command to execute')
    parser.add_argument('--lang', help='Language code for init')

    args = parser.parse_args()

    if args.command == 'extract':
        extract_from_templates()
        create_json_from_pot()

    elif args.command == 'init':
        if not args.lang:
            print("Please specify --lang")
            return
        init_language(args.lang)

    elif args.command == 'update':
        update_translations()
        create_json_from_pot()

    elif args.command == 'compile':
        compile_translations()

    elif args.command == 'all':
        extract_from_templates()
        update_translations()
        compile_translations()
        create_json_from_pot()

if __name__ == '__main__':
    main()