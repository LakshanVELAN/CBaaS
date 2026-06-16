from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .models import Tenant, ApiKey
from .serializers import (
    TenantRegistrationSerializer,
    TenantProfileSerializer,
    ApiKeySerializer,
    ApiKeyCreateSerializer,
    LoginSerializer,
    get_tokens_for_tenant,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new tenant account with JWT tokens."""
    serializer = TenantRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tenant, user = serializer.save()

    # Generate a welcome API key
    raw_key, key_hash, prefix = ApiKey.generate_key(str(tenant.id))
    ApiKey.objects.create(
        tenant=tenant,
        key_hash=key_hash,
        prefix=prefix,
        name='Default Key',
    )

    tokens = get_tokens_for_tenant(tenant)

    return Response({
        'tenant': TenantProfileSerializer(tenant).data,
        'tokens': tokens,
        'api_key': {
            'raw_key': raw_key,
            'prefix': prefix,
            'message': 'Save this key - it will not be shown again.',
        },
        'message': 'Account created successfully.',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate tenant and return JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

    tenant = serializer.validated_data['tenant']
    tokens = get_tokens_for_tenant(tenant)

    return Response({
        'tenant': TenantProfileSerializer(tenant).data,
        'tokens': tokens,
    })


@api_view(['GET', 'PATCH'])
def profile(request):
    """Get or update the current tenant's profile."""
    tenant = request.tenant

    if request.method == 'GET':
        return Response(TenantProfileSerializer(tenant).data)

    serializer = TenantProfileSerializer(tenant, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def api_keys_list_create(request):
    """List all API keys or create a new one."""
    tenant = request.tenant

    if request.method == 'GET':
        keys = ApiKey.objects.filter(tenant=tenant)
        return Response(ApiKeySerializer(keys, many=True).data)

    serializer = ApiKeyCreateSerializer(data=request.data, context={'tenant': tenant})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    api_key, raw_key = serializer.save()

    return Response({
        'id': str(api_key.id),
        'raw_key': raw_key,
        'prefix': api_key.prefix,
        'name': api_key.name,
        'message': 'Save this key - it will not be shown again.',
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def api_keys_delete(request, key_id):
    """Revoke an API key."""
    tenant = request.tenant
    try:
        api_key = ApiKey.objects.get(id=key_id, tenant=tenant)
        api_key.is_active = False
        api_key.save()
        return Response({'message': 'API key revoked successfully.'})
    except ApiKey.DoesNotExist:
        return Response(
            {'error': 'API key not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
