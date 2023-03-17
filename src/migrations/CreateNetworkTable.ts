import { Migration } from '../class/base';

export default class CreateNetworkTable extends Migration {

    order: number =  1;
    name: string = "CreateNetworkTable";

    get query(): string {
        return `create table if not exists networks
        (
            id         bigint unsigned auto_increment primary key,
            name       varchar(191)            not null,
            chain_id   int                     not null,
            rpc        varchar(191) default '' null,
            wss        varchar(191) default '' null,
            explorer   varchar(191) default '' null,
            status     tinyint(1)   default 0  not null,
            created_at timestamp               null,
            updated_at timestamp               null
        ) collate = utf8mb4_unicode_ci;`
    }

}