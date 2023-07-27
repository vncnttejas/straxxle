import { Tag } from 'src/app/tags/entities';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column()
  tags: Tag[];

  @Column()
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
  index: string;

  @Column()
  filledQty: number;

  @Column()
  filledAt: Date;

  @Column()
  cancelled: boolean;

  @Column()
  cancelledAt: Date;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
