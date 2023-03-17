import { Runner } from '../base';
import { MasterChef } from '../entities';
import { BlockExplorer, Colors } from "../utils";

export class MasterChefRunner extends Runner<MasterChef> {

    run(): void {
        if(this.subject.shape.verified) return;
        BlockExplorer.is_contract_verified(this.network, this.subject.shape.address).then((is_verified: boolean) => {
            if(!is_verified) return;
            this.subject.markAsVerified(this.db).then( () => {
                console.log(`${Colors.BRIGHT_CYAN}[${this.constructor.name}] ${this.subject.shape.address} marked as verified. [${new Date().toLocaleTimeString()}]${Colors.RESET}`);
                this.subject.shape.verified = true;
            });
        }).catch((err) => {
            console.log(`${Colors.RED}[${this.constructor.name}] Error: ${err}`);
        });
    }

}