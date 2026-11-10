import { SendByte } from '@sendbyte/node';

const sendbyte = new SendByte(process.env.SENDBYTE_API_KEY);


export default async function sendMail(to, subject, html, senderName = "Onravel Fashion") {
   try{
  return await  sendbyte.emails.send({
    from: `${senderName} <contact@onravelfashion.com>`,
    to,
    subject,
    html,
  });
}catch(error){
    throw new Error(`Failed to send email: ${error.message}`);
  }

}