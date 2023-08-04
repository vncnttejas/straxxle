import { Tag } from '../../tags/entities/tag.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column()
  strike: string;

  @Column()
  qty: number;

  @ManyToMany(() => Tag, (tag) => tag.id)
  @JoinTable()
  tags: Tag[];

  @Column('decimal')
  txnPrice: number;

  @Column()
  contractType: string;

  @Column()
  tt: number;

  @Column()
  exchange: string;

  @Column()
  expiryDate: Date;

  @Column()
  indexSymbol: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
