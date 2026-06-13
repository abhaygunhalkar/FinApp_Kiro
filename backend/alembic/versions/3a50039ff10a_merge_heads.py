"""merge heads

Revision ID: 3a50039ff10a
Revises: a1b2c3d4e5f6, cf3d27a1b9e4
Create Date: 2026-06-13 17:38:54.229581

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a50039ff10a'
down_revision: Union[str, Sequence[str], None] = ('a1b2c3d4e5f6', 'cf3d27a1b9e4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
