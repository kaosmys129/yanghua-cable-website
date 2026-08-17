declare module 'nodemailer' {
  export interface Transporter {
    verify(): Promise<boolean>;
    sendMail(options: unknown): Promise<{ messageId?: string }>;
  }

  const nodemailer: {
    createTransport(options: unknown): Transporter;
  };

  export default nodemailer;
}
