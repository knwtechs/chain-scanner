import { Migration } from '../class/base';

export default class CreateTokenTable extends Migration {

    order: number = 2;
    name: string = "CreateERC1155Table";

    get query(): string {
        return `CREATE TABLE if not exists ERC1155
        (
            id bigint unsigned auto_increment primary key,
            address varchar(191) not null,
            network_id bigint unsigned not null,
            created_at timestamp null,
            updated_at timestamp null,
            uri varchar(512) null,
            score integer unsigned default(0),
            constraint erc1155_address_unique unique (address),
            constraint erc1155_network_id_foreign foreign key (network_id) references networks (id)
        ) collate = utf8mb4_unicode_ci;`
    }
}