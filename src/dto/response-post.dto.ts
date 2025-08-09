export class ResponsePostDto {
  id: string;
  qrCode: string;
  data: {
    vcardType?: string;
    [key: string]: any;
    picPath?: string;
    created_at: string;
  };
}
