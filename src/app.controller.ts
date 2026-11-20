import { Body, Controller, Get, Post, Render } from '@nestjs/common';
import * as mysql from 'mysql2/promise';


const mysqlConnection = mysql.createPool({host: 'localhost', user: 'root', password: '', database: 'reservations13e',});

@Controller()
export class AppController {
  async foglalasokSzama() {
    const [rows] = await mysqlConnection.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS darab FROM reservations',
    );

    return rows[0].darab;
  }

  @Get()
  @Render('index')
  async oldal() {
    return {
      darab: await this.foglalasokSzama(),
      hibak: [],
      siker: '',
      adatok: {
        name: '',
        email: '',
        startDate: '',
        guests: '',
      },
    };
  }

  @Post()
  @Render('index')
  async foglalas(
    @Body()
    adatok: {
      name: string;
      email: string;
      startDate: string;
      guests: string;
    },
  ) {
    const hibak: string[] = [];

    if (!adatok.name || adatok.name.trim() === '') {
      hibak.push('Nev megadasa kotelezo!');
    } else if (adatok.name.length > 100) {
      hibak.push('A nev maximum 100 karakter lehet!');
    }

    
    //https://stackoverflow.com/questions/46155/how-can-i-validate-an-email-address-in-javascript
    if (!adatok.email || !/^[^@\s]+@[^@\s]+$/.test(adatok.email)) {
      hibak.push('adj meg ervenyes email cimet!');
    } else if (adatok.email.length > 100) {
      hibak.push('Az email cim maximum 100 karakter lehet!');
    }

    const datum = new Date(adatok.startDate);
    const most = new Date();

    if (!adatok.startDate || isNaN(datum.getTime())) {
      hibak.push('Adj meg egy ernvenyes datumot es idopontot!');
    } else if (datum < most) {
      hibak.push('A datum es idopont nem lehet multbeli!');
    }

    const vendegek = Number(adatok.guests);

    if (!Number.isInteger(vendegek) || vendegek < 1 || vendegek > 10) {
      hibak.push('A vendegek szama 1 es 10 kozott legyen!');
    }

    if (hibak.length > 0) {
      return {
        darab: await this.foglalasokSzama(),
        hibak: hibak,
        siker: '',
        adatok: adatok,
      };
    }
    //egy bugot talaltam, hogy amikor frissitjuk az oldalt egy sikeres foglalas utan akkor az egeszet ujrakuldi az adatbazisba(ugy hogy nincs semmi text a formban)
    try {
      await mysqlConnection.execute(
        `INSERT INTO reservations (name, email, startDate, guests)
         VALUES (?, ?, ?, ?)`,
        [adatok.name.trim(), adatok.email, datum, vendegek],
      );
    } catch {
      return {
        darab: await this.foglalasokSzama(),
        hibak: ['Nem sikerult menteni a foglalast!'],
        siker: '',
        adatok: adatok,
      };
    }

    return {
      darab: await this.foglalasokSzama(),
      hibak: [],
      siker: 'Sikeres foglalas',
      adatok: {
        name: '',
        email: '',
        startDate: '',
        guests: '',
      },
    };
  }
}