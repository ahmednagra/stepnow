# apps/backend/alembic/versions/05789571f56d_0001_initial_schema.py
"""0001_initial_schema

Revision ID: 05789571f56d
Revises: 
Create Date: 2026-05-11 11:22:35.910725

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '05789571f56d'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table('admin_users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=200), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admin_users_email'), 'admin_users', ['email'], unique=True)
    op.create_index(op.f('ix_admin_users_is_deleted'), 'admin_users', ['is_deleted'], unique=False)
    op.create_table('email_logs',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('to_address', sa.String(length=200), nullable=False),
    sa.Column('template', sa.String(length=200), nullable=False),
    sa.Column('locale', sa.String(length=2), nullable=False),
    sa.Column('subject', sa.String(length=300), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('provider', sa.String(length=50), nullable=True),
    sa.Column('provider_message_id', sa.String(length=200), nullable=True),
    sa.Column('attempts', sa.BigInteger(), nullable=False),
    sa.Column('error', sa.Text(), nullable=True),
    sa.Column('extra', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_logs_created_at'), 'email_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_email_logs_status'), 'email_logs', ['status'], unique=False)
    op.create_index(op.f('ix_email_logs_to_address'), 'email_logs', ['to_address'], unique=False)
    op.create_table('site_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('business_name', sa.String(length=200), nullable=False),
    sa.Column('owner_name', sa.String(length=200), nullable=False),
    sa.Column('legal_form', sa.String(length=100), nullable=False),
    sa.Column('address_street', sa.String(length=200), nullable=False),
    sa.Column('address_postcode', sa.String(length=10), nullable=False),
    sa.Column('address_city', sa.String(length=100), nullable=False),
    sa.Column('address_country', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=50), nullable=False),
    sa.Column('phone_mobile', sa.String(length=50), nullable=True),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('whatsapp_url', sa.String(length=500), nullable=True),
    sa.Column('tax_number', sa.String(length=50), nullable=True),
    sa.Column('vat_id', sa.String(length=50), nullable=True),
    sa.Column('concession_number', sa.String(length=100), nullable=True),
    sa.Column('concession_authority', sa.String(length=200), nullable=True),
    sa.Column('concession_date', sa.Date(), nullable=True),
    sa.Column('opening_hours_de', sa.Text(), nullable=True),
    sa.Column('opening_hours_en', sa.Text(), nullable=True),
    sa.Column('social_facebook', sa.String(length=500), nullable=True),
    sa.Column('social_instagram', sa.String(length=500), nullable=True),
    sa.Column('social_youtube', sa.String(length=500), nullable=True),
    sa.Column('social_tiktok', sa.String(length=500), nullable=True),
    sa.Column('default_meta_title_de', sa.String(length=200), nullable=True),
    sa.Column('default_meta_title_en', sa.String(length=200), nullable=True),
    sa.Column('default_og_image_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint('id = 1', name='single_row'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('audit_log',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('actor_id', sa.UUID(), nullable=True),
    sa.Column('actor_email', sa.String(length=200), nullable=True),
    sa.Column('table_name', sa.String(length=100), nullable=False),
    sa.Column('record_id', sa.String(length=100), nullable=False),
    sa.Column('action', sa.String(length=20), nullable=False),
    sa.Column('changes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('ip_address', sa.String(length=50), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['actor_id'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_log_created_at'), 'audit_log', ['created_at'], unique=False)
    op.create_index(op.f('ix_audit_log_record_id'), 'audit_log', ['record_id'], unique=False)
    op.create_index(op.f('ix_audit_log_table_name'), 'audit_log', ['table_name'], unique=False)
    op.create_table('contact_messages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('subject_category', sa.String(length=50), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('phone', sa.String(length=50), nullable=True),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('language', sa.String(length=2), nullable=False),
    sa.Column('is_handled', sa.Boolean(), nullable=False),
    sa.Column('handled_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ip_address', sa.String(length=50), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('internal_notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contact_messages_is_deleted'), 'contact_messages', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_contact_messages_is_handled'), 'contact_messages', ['is_handled'], unique=False)
    op.create_table('faqs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('question_de', sa.String(length=500), nullable=False),
    sa.Column('question_en', sa.String(length=500), nullable=False),
    sa.Column('answer_de', sa.Text(), nullable=False),
    sa.Column('answer_en', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_faqs_category'), 'faqs', ['category'], unique=False)
    op.create_index(op.f('ix_faqs_is_deleted'), 'faqs', ['is_deleted'], unique=False)
    op.create_table('legal_pages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('slug', sa.String(length=50), nullable=False),
    sa.Column('published_version_id', sa.UUID(), nullable=True),
    sa.Column('draft_version_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.ForeignKeyConstraint(['draft_version_id'], ['legal_page_versions.id'], name='fk_legal_pages_draft_version', use_alter=True),
    sa.ForeignKeyConstraint(['published_version_id'], ['legal_page_versions.id'], name='fk_legal_pages_published_version', use_alter=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_legal_pages_is_deleted'), 'legal_pages', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_legal_pages_slug'), 'legal_pages', ['slug'], unique=True)
    op.create_table('refresh_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(length=255), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('ip_address', sa.String(length=50), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['admin_users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)
    op.create_table('services',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('icon', sa.String(length=50), nullable=True),
    sa.Column('slug_de', sa.String(length=100), nullable=False),
    sa.Column('slug_en', sa.String(length=100), nullable=False),
    sa.Column('title_de', sa.String(length=200), nullable=False),
    sa.Column('title_en', sa.String(length=200), nullable=False),
    sa.Column('short_description_de', sa.String(length=500), nullable=True),
    sa.Column('short_description_en', sa.String(length=500), nullable=True),
    sa.Column('long_description_de', sa.Text(), nullable=True),
    sa.Column('long_description_en', sa.Text(), nullable=True),
    sa.Column('hero_image_url', sa.String(length=500), nullable=True),
    sa.Column('og_image_url', sa.String(length=500), nullable=True),
    sa.Column('meta_title_de', sa.String(length=200), nullable=True),
    sa.Column('meta_title_en', sa.String(length=200), nullable=True),
    sa.Column('meta_description_de', sa.String(length=300), nullable=True),
    sa.Column('meta_description_en', sa.String(length=300), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_services_is_deleted'), 'services', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_services_slug_de'), 'services', ['slug_de'], unique=True)
    op.create_index(op.f('ix_services_slug_en'), 'services', ['slug_en'], unique=True)
    op.create_table('testimonials',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('source', sa.String(length=50), nullable=False),
    sa.Column('author_name', sa.String(length=200), nullable=False),
    sa.Column('author_role_de', sa.String(length=200), nullable=True),
    sa.Column('author_role_en', sa.String(length=200), nullable=True),
    sa.Column('quote_de', sa.Text(), nullable=False),
    sa.Column('quote_en', sa.Text(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=True),
    sa.Column('date_given', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_testimonials_is_deleted'), 'testimonials', ['is_deleted'], unique=False)
    op.create_table('ui_strings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('key', sa.String(length=200), nullable=False),
    sa.Column('namespace', sa.String(length=100), nullable=False),
    sa.Column('value_de', sa.Text(), nullable=False),
    sa.Column('value_en', sa.Text(), nullable=False),
    sa.Column('description', sa.String(length=500), nullable=True),
    sa.Column('is_locked', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ui_strings_is_deleted'), 'ui_strings', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ui_strings_key'), 'ui_strings', ['key'], unique=True)
    op.create_index(op.f('ix_ui_strings_namespace'), 'ui_strings', ['namespace'], unique=False)
    op.create_table('vehicles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('name_de', sa.String(length=200), nullable=False),
    sa.Column('name_en', sa.String(length=200), nullable=False),
    sa.Column('category', sa.String(length=50), nullable=False),
    sa.Column('capacity_passengers', sa.Integer(), nullable=False),
    sa.Column('capacity_luggage', sa.Integer(), nullable=False),
    sa.Column('features_de', postgresql.ARRAY(sa.String(length=200)), nullable=False),
    sa.Column('features_en', postgresql.ARRAY(sa.String(length=200)), nullable=False),
    sa.Column('image_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vehicles_is_deleted'), 'vehicles', ['is_deleted'], unique=False)
    op.create_table('booking_requests',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('reference', sa.String(length=50), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=True),
    sa.Column('pickup_address', sa.String(length=500), nullable=False),
    sa.Column('pickup_postcode', sa.String(length=10), nullable=True),
    sa.Column('pickup_city', sa.String(length=100), nullable=True),
    sa.Column('destination_address', sa.String(length=500), nullable=False),
    sa.Column('destination_postcode', sa.String(length=10), nullable=True),
    sa.Column('destination_city', sa.String(length=100), nullable=True),
    sa.Column('requested_datetime', sa.DateTime(timezone=True), nullable=False),
    sa.Column('passenger_count', sa.Integer(), nullable=False),
    sa.Column('luggage_count', sa.Integer(), nullable=False),
    sa.Column('special_requirements', sa.Text(), nullable=True),
    sa.Column('customer_name', sa.String(length=200), nullable=False),
    sa.Column('customer_phone', sa.String(length=50), nullable=False),
    sa.Column('customer_email', sa.String(length=200), nullable=False),
    sa.Column('is_business', sa.Boolean(), nullable=False),
    sa.Column('company_name', sa.String(length=200), nullable=True),
    sa.Column('company_vatid', sa.String(length=50), nullable=True),
    sa.Column('language', sa.String(length=2), nullable=False),
    sa.Column('ip_address', sa.String(length=50), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('quoted_price_eur', sa.String(length=50), nullable=True),
    sa.Column('quoted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('internal_notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_requests_is_deleted'), 'booking_requests', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_booking_requests_reference'), 'booking_requests', ['reference'], unique=True)
    op.create_index(op.f('ix_booking_requests_requested_datetime'), 'booking_requests', ['requested_datetime'], unique=False)
    op.create_index(op.f('ix_booking_requests_service_id'), 'booking_requests', ['service_id'], unique=False)
    op.create_index(op.f('ix_booking_requests_status'), 'booking_requests', ['status'], unique=False)
    op.create_table('legal_page_versions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('legal_page_id', sa.UUID(), nullable=False),
    sa.Column('version_number', sa.Integer(), nullable=False),
    sa.Column('title_de', sa.String(length=200), nullable=False),
    sa.Column('title_en', sa.String(length=200), nullable=False),
    sa.Column('body_de', sa.Text(), nullable=False),
    sa.Column('body_en', sa.Text(), nullable=False),
    sa.Column('created_by', sa.UUID(), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_published', sa.Boolean(), nullable=False),
    sa.Column('changes_summary', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['created_by'], ['admin_users.id'], ),
    sa.ForeignKeyConstraint(['legal_page_id'], ['legal_pages.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_legal_page_versions_legal_page_id'), 'legal_page_versions', ['legal_page_id'], unique=False)
    op.create_table('pricing_categories',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('name_de', sa.String(length=200), nullable=False),
    sa.Column('name_en', sa.String(length=200), nullable=False),
    sa.Column('description_de', sa.String(length=500), nullable=True),
    sa.Column('description_en', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pricing_categories_is_deleted'), 'pricing_categories', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_pricing_categories_service_id'), 'pricing_categories', ['service_id'], unique=False)
    op.create_table('pricing_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.Column('from_location_de', sa.String(length=200), nullable=True),
    sa.Column('from_location_en', sa.String(length=200), nullable=True),
    sa.Column('to_location_de', sa.String(length=200), nullable=True),
    sa.Column('to_location_en', sa.String(length=200), nullable=True),
    sa.Column('price_eur', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('note_de', sa.String(length=500), nullable=True),
    sa.Column('note_en', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('deleted_by', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['category_id'], ['pricing_categories.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['deleted_by'], ['admin_users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pricing_items_category_id'), 'pricing_items', ['category_id'], unique=False)
    op.create_index(op.f('ix_pricing_items_is_deleted'), 'pricing_items', ['is_deleted'], unique=False)



def downgrade() -> None:

    op.drop_index(op.f('ix_pricing_items_is_deleted'), table_name='pricing_items')
    op.drop_index(op.f('ix_pricing_items_category_id'), table_name='pricing_items')
    op.drop_table('pricing_items')
    op.drop_index(op.f('ix_pricing_categories_service_id'), table_name='pricing_categories')
    op.drop_index(op.f('ix_pricing_categories_is_deleted'), table_name='pricing_categories')
    op.drop_table('pricing_categories')
    op.drop_index(op.f('ix_legal_page_versions_legal_page_id'), table_name='legal_page_versions')
    op.drop_table('legal_page_versions')
    op.drop_index(op.f('ix_booking_requests_status'), table_name='booking_requests')
    op.drop_index(op.f('ix_booking_requests_service_id'), table_name='booking_requests')
    op.drop_index(op.f('ix_booking_requests_requested_datetime'), table_name='booking_requests')
    op.drop_index(op.f('ix_booking_requests_reference'), table_name='booking_requests')
    op.drop_index(op.f('ix_booking_requests_is_deleted'), table_name='booking_requests')
    op.drop_table('booking_requests')
    op.drop_index(op.f('ix_vehicles_is_deleted'), table_name='vehicles')
    op.drop_table('vehicles')
    op.drop_index(op.f('ix_ui_strings_namespace'), table_name='ui_strings')
    op.drop_index(op.f('ix_ui_strings_key'), table_name='ui_strings')
    op.drop_index(op.f('ix_ui_strings_is_deleted'), table_name='ui_strings')
    op.drop_table('ui_strings')
    op.drop_index(op.f('ix_testimonials_is_deleted'), table_name='testimonials')
    op.drop_table('testimonials')
    op.drop_index(op.f('ix_services_slug_en'), table_name='services')
    op.drop_index(op.f('ix_services_slug_de'), table_name='services')
    op.drop_index(op.f('ix_services_is_deleted'), table_name='services')
    op.drop_table('services')
    op.drop_index(op.f('ix_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')
    op.drop_index(op.f('ix_legal_pages_slug'), table_name='legal_pages')
    op.drop_index(op.f('ix_legal_pages_is_deleted'), table_name='legal_pages')
    op.drop_table('legal_pages')
    op.drop_index(op.f('ix_faqs_is_deleted'), table_name='faqs')
    op.drop_index(op.f('ix_faqs_category'), table_name='faqs')
    op.drop_table('faqs')
    op.drop_index(op.f('ix_contact_messages_is_handled'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_is_deleted'), table_name='contact_messages')
    op.drop_table('contact_messages')
    op.drop_index(op.f('ix_audit_log_table_name'), table_name='audit_log')
    op.drop_index(op.f('ix_audit_log_record_id'), table_name='audit_log')
    op.drop_index(op.f('ix_audit_log_created_at'), table_name='audit_log')
    op.drop_table('audit_log')
    op.drop_table('site_settings')
    op.drop_index(op.f('ix_email_logs_to_address'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_status'), table_name='email_logs')
    op.drop_index(op.f('ix_email_logs_created_at'), table_name='email_logs')
    op.drop_table('email_logs')
    op.drop_index(op.f('ix_admin_users_is_deleted'), table_name='admin_users')
    op.drop_index(op.f('ix_admin_users_email'), table_name='admin_users')
    op.drop_table('admin_users')

