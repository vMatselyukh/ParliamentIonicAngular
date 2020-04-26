import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import {
    DbContext, ParliamentApi, ConfigManager,
    WebServerLinkProvider, AlertManager,
    AdvProvider, LoadingManager,
    FileManager, LanguageManager
} from '../providers/providers';
import { AdMobFree } from "@ionic-native/admob-free/ngx";
import { Network } from '@ionic-native/network/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';
import { HttpClientModule } from '@angular/common/http';

import { FormsModule } from '@angular/forms';

import { ProposeQuotePageModule } from './propose-quote/propose-quote.module';
import { LanguagePage } from './language/language.page';
import { LanguagePageModule } from './language/language.module';
import { ProposeQuotePage } from './propose-quote/propose-quote.page';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Zip } from '@ionic-native/zip/ngx';
import { ShareModule } from '@ngx-share/core';

@NgModule({
    declarations: [AppComponent],
    entryComponents: [ProposeQuotePage, LanguagePage],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule,
        FormsModule, ProposeQuotePageModule, LanguagePageModule, ShareModule, IonicStorageModule.forRoot({
            name: '__parliament_db'
        })],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        DbContext,
        ParliamentApi,
        ConfigManager,
        WebServerLinkProvider,
        SocialSharing,
        AdMobFree,
        Network,
        AlertManager,
        AdvProvider,
        LoadingManager,
        File,
        FileTransfer,
        WebView,
        AndroidPermissions,
        FileManager,
        LanguageManager,
        Diagnostic,
        Zip
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
