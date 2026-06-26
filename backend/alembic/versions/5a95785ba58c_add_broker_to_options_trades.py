"""add_broker_to_options_trades

Revision ID: 5a95785ba58c
Revises: 3a50039ff10a
Create Date: 2026-06-26 09:48:17.491278

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a95785ba58c'
down_revision: Union[str, Sequence[str], None] = '3a50039ff10a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('options_trades', schema=None) as batch_op:
        batch_op.add_column(sa.Column('broker', sa.String(length=50), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('options_trades', schema=None) as batch_op:
        batch_op.drop_column('broker')
