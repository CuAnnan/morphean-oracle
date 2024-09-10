import KithainSheet from './KithainSheet.js';
import fetch from "node-fetch";
import xlsx from "xlsx";
import {Art, Attribute, Background, Glamour, Knowledge, Realm, Skill, Talent, Trait, Willpower} from "./Traits.js";

class GoogleKithainSheet extends KithainSheet
{
    static async fromGoogleSheetsURL(url)
    {
        if(url.includes("/edit"))
        {
            throw new Error("It looks like you're trying to import from the edit URL not the export URL.");
        }

        if(url.endsWith('pubhtml'))
        {
            url = url.replace(/pubhtml$/, 'pub?output=xlsx');
        }

        let response = await fetch(url);
        let buffer = await response.arrayBuffer();
        let document = xlsx.read(buffer);
        let worksheet = document.Sheets['Build sheet'];

        let sheet = new this(url);

        let valueFromCell = (cellAddressObject)=>{
            let cellAddress = xlsx.utils.encode_cell(cellAddressObject);
            let cell = worksheet[cellAddress];
            return cell?cell.v:0;
        };

        // set kith and house
        sheet.setKith(worksheet['P2'].v);
        if(worksheet['I3'])
        {
            sheet.setHouse(worksheet['I3'].v);
        }

        // troll stuff to handle how the free strength dots work
        if(worksheet['J48'])
        {
            sheet.secondOathSworn = true;
        }

        sheet.name = worksheet['B1']?.v;
        sheet.player = worksheet['B2']?.v;
        sheet.chronicle = worksheet['B3']?.v;
        sheet.court = worksheet['I1']?.v;
        sheet.legacies.seelie = worksheet['I2']?.v;
        sheet.legacies.unseelie = worksheet['J2']?.v;
        sheet.seeming = worksheet['P1']?.v;
        sheet.motley = worksheet['P3']?.v;
        sheet.secondOathSworn = !!worksheet['J48'];

        // helper function that only matters here.
        // doing it this way erases the need to address scope. Because the worksheet and sheet variables only exist in this function.
        let readTraitsFromRange = (traitConstructor, addressRange)=>
        {
            let list = xlsx.utils.decode_range(addressRange);
            for(let row = list.s.r; row <= list.e.r; row++)
            {
                let nameCellAddress = xlsx.utils.encode_cell({c:list.s.c, r:row});
                let name = worksheet[nameCellAddress]?.v;
                if(typeof name !== 'undefined')
                {
                    let cp = valueFromCell({c:list.s.c + 3, r:row});
                    let fp = valueFromCell({c:list.s.c + 4, r:row});
                    let xp = valueFromCell({c:list.s.c + 5, r:row});

                    if(traitConstructor.name === 'Realm')
                    {
                        sheet.addTrait(new traitConstructor(name, cp, fp, xp, name === sheet.favouredRealm));
                    }
                    else
                    {
                        let trait = new traitConstructor(name, cp, fp, xp);
                        let specCellAddress = xlsx.utils.encode_cell({c:list.s.c + 1, r:row});
                        let spec = worksheet[specCellAddress]?.v;

                        if(typeof spec !== 'undefined')
                        {
                            trait.setSpecialty(spec);
                        }
                        sheet.addTrait(trait);
                    }
                }
            }
        }

        // actually do the reading of traits
        readTraitsFromRange(Talent, 'A13:F22');
        readTraitsFromRange(Skill, 'H13:M22');
        readTraitsFromRange(Knowledge,'O13:T22');
        readTraitsFromRange(Attribute,'A7:F9');
        readTraitsFromRange(Attribute,'H7:M9');
        readTraitsFromRange(Attribute,'O7:T9');
        readTraitsFromRange(Background,'A26:F31');
        readTraitsFromRange(Art,'H26:M31');
        readTraitsFromRange(Realm, 'O26:T31');

        let glamour = new Glamour(
            worksheet['K44']?worksheet['K44'].v:0,
            worksheet['L44']?worksheet['L44'].v:0,
            worksheet['M44']?worksheet['M44'].v:0
        );
        if(worksheet['J44'])
        {
            glamour.setFreeLevels(1);
        }
        sheet.addTrait(glamour);

        let willpower = new Willpower(
            worksheet['K45']?worksheet['K45'].v:0,
            worksheet['L45']?worksheet['L45'].v:0,
            worksheet['M45']?worksheet['M45'].v:0
        );
        if(worksheet['J45'])
        {
            willpower.setFreeLevels(1);
        }
        sheet.addTrait(willpower);

        let nightmare = new Trait('Nightmare', worksheet['J45']?worksheet['J45'].v:0);
        sheet.addTrait(nightmare);
        let banality = new Trait('Banality', worksheet['J46']?worksheet['J46'].v:3);
        sheet.addTrait(banality);

        sheet.finalize();

        return sheet;
    }
}

export default GoogleKithainSheet;