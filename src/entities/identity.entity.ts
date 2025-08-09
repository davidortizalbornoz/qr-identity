import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('identities')
export class Identity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  vcardType: string;

  @Column({ type: 'text', nullable: true })
  picPath: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
