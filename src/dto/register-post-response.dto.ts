export class ResponsePostDto {
  id: number;
  nanoId: string
  qrContent: string;
  vcardType?: string;
  image: {
    imageName?: string;
    imageType?: string;
    imagePathS3?: string;
  };  
  data: any
  created_at: string;
}
