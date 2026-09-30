import nodemailer from 'nodemailer';
import type {Mail} from './app';
import {tr} from '../src/i18n';
/** Real SMTP adapter; configuration is read server-side, never exposed by status APIs. */
export function createSmtpMailer(env:NodeJS.ProcessEnv){
 if(!env.POK_SMTP_HOST||!env.POK_SMTP_FROM||!env.POK_SMTP_USER||!env.POK_SMTP_PASSWORD)throw Error('SMTP requires host, sender, user and password secret references.');
 const port=Number(env.POK_SMTP_PORT||465);if(![465,587].includes(port))throw Error('SMTP must use TLS on port 465 or STARTTLS on 587.');
 const transport=nodemailer.createTransport({host:env.POK_SMTP_HOST,port,secure:port===465,requireTLS:true,auth:{user:env.POK_SMTP_USER,pass:env.POK_SMTP_PASSWORD},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,tls:{minVersion:'TLSv1.2'},logger:false,debug:false});
 return async(mail:Mail)=>{const locale=mail.locale||'en';await transport.sendMail({from:env.POK_SMTP_FROM,to:mail.to,subject:`Poker Odds Knowledge: ${tr(locale,`mail.${mail.purpose}.subject`)}`,text:`Poker Odds Knowledge\n\n${tr(locale,`mail.${mail.purpose}.body`,{url:mail.url})}\n\n${tr(locale,'mail.security')}`})};
}
