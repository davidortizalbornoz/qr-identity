/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('identity')
export class Identity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  nano_id: string;

  @Column({ type: 'text' })
  qr_content: string;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  vcardType: string;

  @Column({ type: 'text', nullable: true })
  picPath: string;
}
