"""add_holding_type_column

Revision ID: a1b2c3d4e5f6
Revises: 6c99e5b26de2
Create Date: 2026-05-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '6c99e5b26de2'
branch_labels = None
depend_on = None


def upgrade() -> None:
    op.add_column(
        'holdings',
        sa.Column('holding_type', sa.String(length=20), nullable=False, server_default='stock'),
    )
    op.alter_column('holdings', 'holding_type', server_default=None)


def downgrade() -> None:
    op.drop_column('holdings', 'holding_type')
