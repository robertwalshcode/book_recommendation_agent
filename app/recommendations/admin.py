from django.contrib import admin
from .models import UserSearchHistory

# Register your models here.

admin.site.register(UserSearchHistory)

# @admin.register(UserSearchHistory)
# class UserSearchHistoryAdmin(admin.ModelAdmin):
#     list_display = ('user', 'created_at', 'preferences')
#     readonly_fields = ('preferences', 'recommendations', 'created_at')