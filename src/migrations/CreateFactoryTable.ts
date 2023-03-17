import { Migration } from '../class/base';

export default class CreateNetworkTable extends Migration {

    order: number =  4;
    name: string = "CreateFactoryTable";

    get query(): string {
        return `create table factories
        (
            id          bigint unsigned auto_increment primary key,
            name        varchar(191)            not null,
            network_id  bigint unsigned         not null,
            address     varchar(191) default '' null,
            created_at  timestamp default CURERENT               null,
            updated_at  timestamp               null
        ) collate = utf8mb4_unicode_ci;`
    }

}