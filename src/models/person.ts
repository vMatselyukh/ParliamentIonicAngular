import { Track, ImageInfo } from './models';

export class Person
{
    Id: number;
    Name: string;
    Post: string;    
    Tracks: Track[];
    MainPicPath: ImageInfo;
    SmallButtonPicPath: ImageInfo;
    ListButtonPicPath: ImageInfo;
}