#!/usr/bin/env python3
"""
Jinja2 extensions for date, number, and currency localization.
"""

import re
from datetime import datetime
from babel.dates import format_datetime, format_date, format_time
from babel.numbers import format_number, format_decimal, format_currency, format_percent
from babel.core import Locale


class I18nExtensions:
    """Class with i18n formatting methods for Jinja2 templates."""

    def __init__(self, language_code='en'):
        self.language_code = language_code
        self.locale = Locale.parse(language_code)

    def format_date(self, date_obj, format='medium'):
        """Format date according to locale."""
        if date_obj is None:
            return ''

        if isinstance(date_obj, str):
            try:
                date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
            except:
                return date_obj

        try:
            return format_date(date_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(date_obj)

    def format_time(self, time_obj, format='medium'):
        """Format time according to locale."""
        if time_obj is None:
            return ''

        if isinstance(time_obj, str):
            try:
                time_obj = datetime.fromisoformat(time_obj.replace('Z', '+00:00'))
            except:
                return time_obj

        try:
            return format_time(time_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(time_obj)

    def format_datetime(self, dt_obj, format='medium'):
        """Format datetime according to locale."""
        if dt_obj is None:
            return ''

        if isinstance(dt_obj, str):
            try:
                dt_obj = datetime.fromisoformat(dt_obj.replace('Z', '+00:00'))
            except:
                return dt_obj

        try:
            return format_datetime(dt_obj, format=format, locale=self.locale)
        except Exception as e:
            return str(dt_obj)

    def format_number(self, number, decimal_places=None):
        """Format number with locale-specific separators."""
        if number is None:
            return ''

        try:
            num = float(number)
            if decimal_places is not None:
                num = round(num, decimal_places)
            return format_decimal(num, locale=self.locale)
        except:
            return str(number)

    def format_currency(self, amount, currency='USD', format='standard'):
        """Format currency according to locale."""
        if amount is None:
            return ''

        try:
            return format_currency(amount, currency, locale=self.locale)
        except:
            return f"{amount} {currency}"

    def format_percent(self, number, decimal_places=0):
        """Format percentage according to locale."""
        if number is None:
            return ''

        try:
            return format_percent(number, decimal_places, locale=self.locale)
        except:
            return f"{number * 100:.{decimal_places}f}%"

    def format_size(self, size_in_bytes, decimal_places=1):
        """Format file size with locale-aware numbers."""
        if size_in_bytes is None:
            return ''

        try:
            size = float(size_in_bytes)
            units = ['B', 'KB', 'MB', 'GB', 'TB']
            unit_index = 0

            while size >= 1024 and unit_index < len(units) - 1:
                size = size / 1024
                unit_index += 1

            # Простое форматирование без Babel
            format_string = f"{{:.{decimal_places}f}}"
            formatted_size = format_string.format(size)
            return f"{formatted_size} {units[unit_index]}"
        except Exception as e:
            print(f"format_size error: {e}")
            return f"{size_in_bytes} B"

    def ngettext(self, singular, plural, n):
        """Pluralization helper."""
        if self.language_code == 'ru':
            if n % 10 == 1 and n % 100 != 11:
                return singular
            elif 2 <= n % 10 <= 4 and (n % 100 < 10 or n % 100 >= 20):
                return plural
            else:
                return plural
        else:
            return singular if n == 1 else plural


def create_i18n_environment(language_code='en'):
    """Create i18n functions and filters for Jinja2 environment."""
    i18n = I18nExtensions(language_code)

    functions = {
        'format_date': i18n.format_date,
        'format_time': i18n.format_time,
        'format_datetime': i18n.format_datetime,
        'format_number': i18n.format_number,
        'format_currency': i18n.format_currency,
        'format_percent': i18n.format_percent,
        'format_size': i18n.format_size,
        'ngettext': i18n.ngettext,
    }

    filters = {
        'date': i18n.format_date,
        'time': i18n.format_time,
        'datetime': i18n.format_datetime,
        'number': i18n.format_number,
        'currency': i18n.format_currency,
        'percent': i18n.format_percent,
        'size': i18n.format_size,
    }

    return {'functions': functions, 'filters': filters}