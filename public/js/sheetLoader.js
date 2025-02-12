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

    fetch(`/sheets/fetchJSON/${nanoid}`).then(
        response=>{
            response.json().then(sheetJSON=>{
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
            });
        }
    );


    document.getElementById('rollButton').addEventListener('click', ()=>{
        if(roll)
        {
            let json = Object.assign({},roll,{
                    diff:parseInt($diff.value),
                    spec:$spec.checked,
                    wyrd:$wyrd.checked,
                    will:$will.checked
            });
            fetch(
                `/sheets/roll/${nanoid}`,
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
                            let html = `<span title="${response.nano}">`
                            if(result.successes > 0)
                            {
                                html += `${result.successes} successes.`;
                            }
                            else if(result.botch)
                            {
                                html += 'Botch!';
                            }
                            else
                            {
                                html += 'Failure.';
                            }

                            let dice = result.faces
                                .sort((x, y)=> x - y) // sort the dice
                                .map((x)=>x === 1?`<i>${x}</i>`:(x >= result.diff?`<strong>${x}</strong>`:x)) // italicise 1s, bold successes
                                .join(', '); // turn it to a string

                            html += ` [${dice}]</span>`; // add it to the result node
                            $result.innerHTML = html;
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

    document.querySelectorAll('.traitBox').forEach(el=>{
        el.addEventListener('click',()=>{
            if(el.classList.contains('bxs-square'))
            {
                return;
            }

            if(el.classList.contains('bxs-x-square'))
            {
                el.classList.add('bx-square');
                el.classList.remove('bxs-x-square');
            }
            else
            {
                el.classList.remove('bx-square');
                el.classList.add('bxs-x-square');
            }
            let sibling = el.previousSibling;
            while(sibling && !sibling.classList.contains('bxs-square'))
            {
                sibling.classList.remove('bx-square');
                sibling.classList.add('bxs-x-square');
                sibling = sibling.previousSibling;
            }

            sibling = el.nextSibling;
            while(sibling && !sibling.classList.contains('bxs-square'))
            {
                sibling.classList.add('bx-square');
                sibling.classList.remove('bxs-x-square');
                sibling = sibling.nextSibling;
            }


        });
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