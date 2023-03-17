import { SafeWeb3 } from '../class/base';

type Channel = SafeWeb3;

export interface Resolvable {
    resolve: (channel: Channel) => Promise<any> ;
}