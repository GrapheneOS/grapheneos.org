#!/usr/bin/env python3
"""
Расширения Jinja2 для локализации дат, чисел и валют.
Файл: jinja2_i18n_extras.py
"""
import re
from datetime import datetime
from babel.dates import format_datetime, format_date, format_time
from babel.numbers import format_number, format_decimal, format_currency, format_percent
from babel.core import get_global, Locale
import locale as sys_locale

class I18nExtensions:
    """
    Класс с методами для локализации, которые можно использовать в Jinja2 шаблонах.
    """

    def __init__(self, language_code='en'):
        """
        Инициализация с указанием языка.

        Args:
            language_code: Код языка (en, ru, de, fr, es)
        """
        self.language_code = language_code
        self.locale = Locale.parse(language_code)

        # Устанавливаем системную локаль для Python (опционально)
        try:
            sys_locale.setlocale(sys_locale.LC_ALL, f'{language_code}.UTF-8')
        except:
            pass  # Если локаль не поддерживается, игнорируем

    def format_date(self, date_obj, format='medium'):
        """
        Форматирует дату с учетом локали.

        Форматы:
            - 'short': 31.12.2024
            - 'medium': Dec 31, 2024
            - 'long': December 31, 2024
            - 'full': Tuesday, December 31, 2024
            - 'yyyy-MM-dd': кастомный формат

        Args:
            date_obj: Объект datetime или date или строка
            format: Строка формата ('short', 'medium', 'long', 'full' или кастомный)

        Returns:
            str: Отформатированная дата
        """
        if date_obj is None:
            return ''

        # Преобразуем строку в datetime если нужно
        if isinstance(date_obj, str):
            try:
                date_obj = datetime.fromisoformat(date_obj)
            except:
                return date_obj

        try:
            # Если format не стандартный, используем его как паттерн
            if format in ['short', 'medium', 'long', 'full']:
                return format_date(date_obj, format=format, locale=self.locale)
            else:
                return format_date(date_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(date_obj)

    def format_time(self, time_obj, format='medium'):
        """
        Форматирует время с учетом локали.

        Форматы:
            - 'short': 23:59
            - 'medium': 11:59:59 PM
            - 'long': 11:59:59 PM UTC
            - 'full': 11:59:59 PM UTC

        Args:
            time_obj: Объект datetime или time или строка
            format: Строка формата

        Returns:
            str: Отформатированное время
        """
        if time_obj is None:
            return ''

        if isinstance(time_obj, str):
            try:
                time_obj = datetime.fromisoformat(time_obj)
            except:
                return time_obj

        try:
            return format_time(time_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(time_obj)

    def format_datetime(self, dt_obj, format='medium'):
        """
        Форматирует дату и время с учетом локали.

        Args:
            dt_obj: Объект datetime или строка
            format: Строка формата ('short', 'medium', 'long', 'full')

        Returns:
            str: Отформатированная дата и время
        """
        if dt_obj is None:
            return ''

        if isinstance(dt_obj, str):
            try:
                dt_obj = datetime.fromisoformat(dt_obj)
            except:
                return dt_obj

        try:
            return format_datetime(dt_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(dt_obj)

    def format_number(self, number, decimal_places=None):
        """
        Форматирует число с учетом локали (разделители тысяч и десятичной части).

        Args:
            number: Число (int или float)
            decimal_places: Количество знаков после запятой (опционально)

        Returns:
            str: Отформатированное число
        """
        if number is None:
            return ''

        try:
            if decimal_places is not None:
                number = round(float(number), decimal_places)
            return format_decimal(number, locale=self.locale)
        except:
            return str(number)

    def format_currency(self, amount, currency='USD', format='standard'):
        """
        Форматирует валюту с учетом локали.

        Args:
            amount: Сумма
            currency: Код валюты (USD, EUR, RUB, etc.)
            format: Формат ('standard', 'name', 'symbol')

        Returns:
            str: Отформатированная сумма в валюте
        """
        if amount is None:
            return ''

        try:
            # Определяем формат
            if format == 'name':
                # Получаем название валюты на текущем языке
                currency_name = get_global('currency_names').get(currency, {}).get(self.language_code, currency)
                return f"{format_decimal(amount, locale=self.locale)} {currency_name}"
            elif format == 'symbol':
                return format_currency(amount, currency, locale=self.locale)
            else:
                return format_currency(amount, currency, locale=self.locale)
        except Exception as e:
            return f"{amount} {currency}"

    def format_percent(self, number, decimal_places=0):
        """
        Форматирует процент с учетом локали.

        Args:
            number: Число (0.15 = 15%)
            decimal_places: Количество знаков после запятой

        Returns:
            str: Отформатированный процент
        """
        if number is None:
            return ''

        try:
            return format_percent(number, decimal_places, locale=self.locale)
        except:
            return f"{number * 100:.{decimal_places}f}%"

    def format_size(self, size_in_bytes, decimal_places=1):
        """
        Форматирует размер файла с учетом локали.

        Args:
            size_in_bytes: Размер в байтах
            decimal_places: Количество знаков после запятой

        Returns:
            str: Отформатированный размер (KB, MB, GB)
        """
        if size_in_bytes is None:
            return ''

        try:
            size = float(size_in_bytes)
            units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
            unit_index = 0

            while size >= 1024 and unit_index < len(units) - 1:
                size /= 1024
                unit_index += 1

            formatted_size = format_decimal(size, decimal_places, locale=self.locale)
            return f"{formatted_size} {units[unit_index]}"
        except:
            return f"{size_in_bytes} B"

    def format_relative_date(self, date_obj, now=None):
        """
        Форматирует дату относительно текущего момента.

        Args:
            date_obj: Объект datetime
            now: Текущий момент (опционально)

        Returns:
            str: Относительная дата (today, yesterday, etc.)
        """
        if date_obj is None:
            return ''

        if isinstance(date_obj, str):
            try:
                date_obj = datetime.fromisoformat(date_obj)
            except:
                return date_obj

        if now is None:
            now = datetime.now()

        diff = now.date() - date_obj.date()

        # Локализованные слова
        translations = {
            'en': {'today': 'today', 'yesterday': 'yesterday', 'tomorrow': 'tomorrow', 'days_ago': '{0} days ago'},
            'ru': {'today': 'сегодня', 'yesterday': 'вчера', 'tomorrow': 'завтра', 'days_ago': '{0} дней назад'},
            'fr': {'today': "aujourd'hui", 'yesterday': 'hier', 'tomorrow': 'demain', 'days_ago': 'il y a {0} jours'},
            'de': {'today': 'heute', 'yesterday': 'gestern', 'tomorrow': 'morgen', 'days_ago': 'vor {0} Tagen'},
            'es': {'today': 'hoy', 'yesterday': 'ayer', 'tomorrow': 'mañana', 'days_ago': 'hace {0} días'},
        }

        t = translations.get(self.language_code, translations['en'])

        if diff.days == 0:
            return t['today']
        elif diff.days == 1:
            return t['yesterday']
        elif diff.days == -1:
            return t['tomorrow']
        elif diff.days > 0:
            return t['days_ago'].format(format_number(diff.days))
        else:
            return self.format_date(date_obj, format='short')

    def get_language_name(self, lang_code=None):
        """
        Возвращает название языка на текущем языке.

        Args:
            lang_code: Код языка (если None, возвращает название текущего языка)

        Returns:
            str: Название языка
        """
        if lang_code is None:
            lang_code = self.language_code

        lang_names = {
            'en': 'English',
            'ru': 'Русский',
            'fr': 'Français',
            'de': 'Deutsch',
            'es': 'Español',
        }

        return lang_names.get(lang_code, lang_code)

    def get_language_flag(self, lang_code=None):
        """
        Возвращает эмодзи флага для языка.

        Args:
            lang_code: Код языка

        Returns:
            str: Эмодзи флага
        """
        flags = {
            'en': '🇬🇧',
            'ru': '🇷🇺',
            'fr': '🇫🇷',
            'de': '🇩🇪',
            'es': '🇪🇸',
        }
        return flags.get(lang_code or self.language_code, '🌐')


def create_i18n_environment(language_code='en'):
    """
    Создает окружение Jinja2 с расширениями для локализации.

    Args:
        language_code: Код языка

    Returns:
        dict: Словарь с функциями и фильтрами для Jinja2
    """
    i18n = I18nExtensions(language_code)

    # Создаем словарь с функциями для шаблонов
    functions = {
        # Функции для дат
        'format_date': i18n.format_date,
        'format_time': i18n.format_time,
        'format_datetime': i18n.format_datetime,
        'format_relative_date': i18n.format_relative_date,

        # Функции для чисел
        'format_number': i18n.format_number,
        'format_currency': i18n.format_currency,
        'format_percent': i18n.format_percent,
        'format_size': i18n.format_size,

        # Функции для языка
        'get_language_name': i18n.get_language_name,
        'get_language_flag': i18n.get_language_flag,

        # Основные переменные
        'lang': language_code,
        'locale': i18n.locale,
    }

    # Создаем фильтры для Jinja2 (можно использовать как |format_date)
    filters = {
        'date': i18n.format_date,
        'time': i18n.format_time,
        'datetime': i18n.format_datetime,
        'number': i18n.format_number,
        'currency': i18n.format_currency,
        'percent': i18n.format_percent,
        'size': i18n.format_size,
        'rel_date': i18n.format_relative_date,
    }

    return {'functions': functions, 'filters': filters}

