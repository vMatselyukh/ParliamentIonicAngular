import { Track, ImageInfo } from './models';

export class Person
{
    Id: number;
    OrderNumber: number;
    Name: string;
    Post: string;    
    Tracks: Track[];
    MainPicPath: ImageInfo;
    SmallButtonPicPath: ImageInfo;
    ListButtonPicPath: ImageInfo;
    ListButtonDevicePath: string;
    SmallButtonDevicePath: string;
    MainPicDevicePath: string;
}