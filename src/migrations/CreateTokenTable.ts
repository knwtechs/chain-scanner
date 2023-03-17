import { Migration } from '../class/base';

export default class CreateTokenTable extends Migration {

    order: number = 2;
    name: string = "CreateTokenTable";

    get query(): string {
        return `CREATE TABLE if not exists tokens
        (
            id bigint unsigned auto_increment primary key,
            address varchar(191) not null,
            network_id bigint unsigned not null,
            created_at timestamp null,
            updated_at timestamp null,
            name varchar(128) null,
            symbol varchar(256) null,
            totalSupply varchar(128) null,
            circulatingSupply varchar(128) null,
            owner varchar(255) default '0' null,
            ownerBalance varchar(128) null,
            constraint tokens_address_unique unique (address),
            constraint tokens_network_id_foreign foreign key (network_id) references networks (id)
        ) collate = utf8mb4_unicode_ci;`
    }
}