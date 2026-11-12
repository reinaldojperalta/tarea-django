"""Paginación del listado de sismos."""

from rest_framework.pagination import PageNumberPagination


class PaginacionSismos(PageNumberPagination):
    """50 sismos por página; ?page_size= permite recortar en la prueba."""

    page_size = 50
    page_size_query_param = 'page_size'
