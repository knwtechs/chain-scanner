import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export type IMailer = {
    host: string,
    username: string,
    password: string,
    port: number,
    logger: boolean,
    useTLS: boolean,
    useSSL: boolean
}

/*
    {
        from: '"Sender Name" <from@example.net>',
        to: "to@example.com",
        subject: "Hello from node",
        text: "Hello world?",
        html: "<strong>Hello world?</strong>",
        headers: { 'x-myheader': 'test header' }
    }
*/
export type IMail = {
    from: string,
    to: string | string[],
    subject: string,
    text?: string,
    html?: string,
    headers?: {[key: string]: string}
}
export class Mailer {

    host: string;
    username: string;
    password: string;
    port: number;
    logger: boolean;
    useTLS: boolean;
    useSSL: boolean;
    connection: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | undefined;

    constructor(mailerConfig: IMailer) {
        this.host = mailerConfig.host;
        this.username = mailerConfig.username;
        this.password = mailerConfig.password;
        this.port = mailerConfig.port;
        this.logger = mailerConfig.logger;
        this.useSSL = mailerConfig.useSSL;
        this.useTLS = mailerConfig.useTLS;
    }

    init = () => { 
        if(this.connection === undefined){
            this.connection = nodemailer.createTransport({
                host: this.host,
                port: this.port,
                secure: this.useSSL,
                requireTLS: this.useTLS,
                auth: {
                    user: this.username,
                    pass: this.password,
                },
                logger: this.logger
            });
        }
    }

    sendMail = async (options: IMail) => {
        if(!this.connection) return;
        try{
            return await this.connection.sendMail(options);
        } catch(err){
            console.error(err);
        }
    }
}
