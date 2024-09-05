'use strict';
import Sheet from '/model/KithainSheet.js';


function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

window.addEventListener('load', function(){
    let $rollParts = document.getElementById('rollParts');
    let $diff = document.getElementById('diff');
    let $wyrd = document.getElementById('wyrd');
    let $spec = document.getElementById('spec');
    let $will = document.getElementById('willpower');
    let $result = document.getElementById('result');
    let rollParts = {};
    let roll = null;
    let sheet;


    document.getElementById('rollButton').addEventListener('click', ()=>{
        if(roll)
        {
            let json = {
                pool:roll,
                diff:parseInt($diff.value),
                spec:$spec.checked,
                wyrd:$wyrd.checked,
                will:$will.checked
            };
            fetch(
                `/sheets/roll/${hash}`,
                {
                    method:'POST',
                    headers:{"Content-Type": "application/json"},
                    body:JSON.stringify(json)
                }
            ).then(response=>{
                response
                    .json()
                    .then((response)=>{
                        if(response.success)
                        {
                            let {result} = response;
                            if(result.successes > 0)
                            {
                                $result.innerHTML = `${result.successes} successes.`;
                            }
                            else if(result.botch)
                            {
                                $result.innerHTML = 'Botch!';
                            }
                            else
                            {
                                $result.innerHTML = 'Failure.';
                            }

                            let dice = result.dice
                                .sort((x, y)=> x - y) // sort the dice
                                .map((x)=>x === 1?`<i>${x}</i>`:(x >= result.diff?`<strong>${x}</strong>`:x)) // italicise 1s, bold successes
                                .join(', '); // turn it to a string

                            $result.innerHTML += ` [${dice}]`; // add it to the result node
                        }
                    })
            });
        }
    });

    function reloadRollParts()
    {
        $rollParts.innerHTML = "";
        roll = null;
        let html = "";
        let keys = Object.keys(rollParts);
        if(keys.length)
        {
            roll = sheet.getPool(keys);
        }
        for(let i = 0; i < keys.length; i ++)
        {
            let rollPart = keys[i];
            let element = document.createElement('span');
            element.innerHTML = rollPart;
            element.classList.add('rollPart')
            $rollParts.appendChild(element);
            element.addEventListener('click', el=>{

                delete rollParts[element.innerHTML];
                reloadRollParts();
            });
            if((i + 1) < keys.length)
            {
                let plusElement = document.createElement('span');
                plusElement.innerHTML = '&nbsp;+&nbsp;';
                $rollParts.appendChild(plusElement);
            }

        }
    }

    Sheet.fromJSON(sheetJSON).then((sheetObject)=>{
        sheet = sheetObject;
        document.querySelectorAll('.traitName').forEach(el=>{
            el.addEventListener('click', ()=>{
                rollParts[el.innerHTML] = true;
                reloadRollParts();
            });
        });
    }).catch((e)=>{
        console.log(e);
    });


    document.querySelectorAll('.toggler').forEach(el=>{
        el.addEventListener('click', ()=>{
            let next = el.parentElement.parentElement.nextElementSibling;
            let vis = next.style.display===''||next.style.display==='flex'
            next.style.display = vis?'none':'flex';
            el.classList.remove('bx-up-arrow-alt', 'bx-down-arrow-alt');
            el.classList.add(vis?'bx-down-arrow-alt':'bx-up-arrow-alt');

        });
    });
});