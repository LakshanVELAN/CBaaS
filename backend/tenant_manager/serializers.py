import hashlib
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.models import User
from .models import Tenant, ApiKey


def decode_jwt(token):
    """Decode a JWT and return the payload or None."""
    from rest_framework_simplejwt.tokens import AccessToken
    try:
        access = AccessToken(token)
        return access.payload
    except Exception:
        return None


class TenantRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for tenant registration."""
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=200)

    class Meta:
        model = Tenant
        fields = ['name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        name = validated_data.get('name', email.split('@')[0])

        # Create Django user for auth
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )

        # Create tenant linked to user
        tenant = Tenant.objects.create(name=name, user=user)
        return tenant, user


class TenantProfileSerializer(serializers.ModelSerializer):
    """Serializer for tenant profile read/update."""
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'plan', 'monthly_message_quota',
                  'allowed_origins', 'custom_system_prompt_override',
                  'is_active', 'created_at']
        read_only_fields = ['id', 'plan', 'monthly_message_quota',
                           'is_active', 'created_at']


class ApiKeySerializer(serializers.ModelSerializer):
    """Serializer for API key management."""
    class Meta:
        model = ApiKey
        fields = ['id', 'prefix', 'name', 'is_active', 'allowed_origins',
                  'last_used_at', 'created_at']
        read_only_fields = ['id', 'prefix', 'last_used_at', 'created_at']


class ApiKeyCreateSerializer(serializers.Serializer):
    """Serializer for creating a new API key."""
    name = serializers.CharField(max_length=100)

    def create(self, validated_data):
        tenant = self.context['tenant']
        raw_key, key_hash, prefix = ApiKey.generate_key(str(tenant.id))
        api_key = ApiKey.objects.create(
            tenant=tenant,
            key_hash=key_hash,
            prefix=prefix,
            name=validated_data['name'],
        )
        return api_key, raw_key


class LoginSerializer(serializers.Serializer):
    """Serializer for tenant login."""
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        # Look up tenant via the user relationship
        try:
            tenant = user.tenant
            if not tenant.is_active:
                raise serializers.ValidationError('Tenant account is deactivated.')
        except User.tenant.RelatedObjectDoesNotExist:
            raise serializers.ValidationError('No tenant found for this account.')
        return {'user': user, 'tenant': tenant}


def get_tokens_for_tenant(tenant):
    """Generate JWT tokens for a tenant."""
    refresh = RefreshToken()
    refresh['tenant_id'] = str(tenant.id)
    refresh['tenant_name'] = tenant.name
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
