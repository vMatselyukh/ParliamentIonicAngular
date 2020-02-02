import { Track, ImageInfo, PersonInfo } from './models';

export class Person
{
    Id: number;
    OrderNumber: number;
    Name: string;
    Tracks: Track[];
    MainPicPath: ImageInfo;
    SmallButtonPicPath: ImageInfo;
    ListButtonPicPath: ImageInfo;
    ListButtonDevicePath: string;
    SmallButtonDevicePath: string;
    MainPicDevicePath: string;
    Infos: PersonInfo[];
}