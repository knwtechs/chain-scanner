import { Migration } from '../class/base';

export default class CreateMasterChefTable extends Migration {

    order: number = 5;
    name: string = "CreateMasterChefTable";

    get query(): string {
        return `CREATE TABLE if not exists masterchefs
        (
            id bigint unsigned auto_increment primary key,
            address varchar(191) not null,
            network_id bigint unsigned not null,
            created_at timestamp null,
            updated_at timestamp null,
            owner varchar(255) default '0' null,
            constraint masterchefs_network_id_foreign foreign key (network_id) references networks (id)
        ) collate = utf8mb4_unicode_ci;`
    }
}