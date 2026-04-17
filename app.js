// RecipeCalc - Recipe Cost Calculator
(function(){
'use strict';
const i18n={
en:{new_recipe:'New Recipe',recipe_name:'Recipe Name',servings:'Servings',sell_price:'Sell Price ($)',
ingredients:'Ingredients',add_ingredient:'Add Ingredient',ingredient_name:'Name',unit_price:'Price ($)',
unit_size:'Size (e.g. 5kg)',save:'Save',language:'Language',ingredient_pantry:'Ingredient Pantry',
cost_per_serving:'Per serving',total_cost:'Total cost',profit_margin:'Profit',
no_recipes:'No recipes yet',no_recipes_desc:'Tap + to calculate your first recipe cost.'},
zh:{new_recipe:'\u65b0\u98df\u8c31',recipe_name:'\u98df\u8c31\u540d\u79f0',servings:'\u4efd\u6570',sell_price:'\u552e\u4ef7 (\u00a5)',
ingredients:'\u98df\u6750',add_ingredient:'\u6dfb\u52a0\u98df\u6750',ingredient_name:'\u540d\u79f0',unit_price:'\u4ef7\u683c (\u00a5)',
unit_size:'\u89c4\u683c(\u59825kg)',save:'\u4fdd\u5b58',language:'\u8bed\u8a00',ingredient_pantry:'\u98df\u6750\u5e93',
cost_per_serving:'\u6bcf\u4efd\u6210\u672c',total_cost:'\u603b\u6210\u672c',profit_margin:'\u5229\u6da6',
no_recipes:'\u8fd8\u6ca1\u6709\u98df\u8c31',no_recipes_desc:'\u70b9\u51fb+\u8ba1\u7b97\u4f60\u7684\u7b2c\u4e00\u4e2a\u98df\u8c31\u6210\u672c\u3002'},
es:{new_recipe:'Nueva receta',recipe_name:'Nombre',servings:'Porciones',sell_price:'Precio de venta ($)',
ingredients:'Ingredientes',add_ingredient:'A\u00f1adir ingrediente',ingredient_name:'Nombre',unit_price:'Precio ($)',
unit_size:'Tama\u00f1o (ej. 5kg)',save:'Guardar',language:'Idioma',ingredient_pantry:'Despensa',
cost_per_serving:'Por porci\u00f3n',total_cost:'Costo total',profit_margin:'Ganancia',
no_recipes:'Sin recetas',no_recipes_desc:'Pulsa + para calcular costos.'},
ja:{new_recipe:'\u65b0\u3057\u3044\u30ec\u30b7\u30d4',recipe_name:'\u30ec\u30b7\u30d4\u540d',servings:'\u4eba\u524d',sell_price:'\u8ca9\u58f2\u4fa1\u683c (\u00a5)',
ingredients:'\u6750\u6599',add_ingredient:'\u6750\u6599\u3092\u8ffd\u52a0',ingredient_name:'\u540d\u524d',unit_price:'\u4fa1\u683c (\u00a5)',
unit_size:'\u30b5\u30a4\u30ba(\u4f8b:5kg)',save:'\u4fdd\u5b58',language:'\u8a00\u8a9e',ingredient_pantry:'\u98df\u6750\u30e9\u30a4\u30d6\u30e9\u30ea',
cost_per_serving:'1\u4eba\u524d\u30b3\u30b9\u30c8',total_cost:'\u5408\u8a08\u30b3\u30b9\u30c8',profit_margin:'\u5229\u76ca',
no_recipes:'\u30ec\u30b7\u30d4\u306a\u3057',no_recipes_desc:'+ \u3092\u62bc\u3057\u3066\u30ec\u30b7\u30d4\u3092\u8ffd\u52a0\u3002'},
de:{new_recipe:'Neues Rezept',recipe_name:'Name',servings:'Portionen',sell_price:'Verkaufspreis (\u20ac)',
ingredients:'Zutaten',add_ingredient:'Zutat hinzuf\u00fcgen',ingredient_name:'Name',unit_price:'Preis (\u20ac)',
unit_size:'Gr\u00f6\u00dfe (z.B. 5kg)',save:'Speichern',language:'Sprache',ingredient_pantry:'Vorratsschrank',
cost_per_serving:'Pro Portion',total_cost:'Gesamtkosten',profit_margin:'Gewinn',
no_recipes:'Keine Rezepte',no_recipes_desc:'+ tippen f\u00fcr erstes Rezept.'},
fr:{new_recipe:'Nouvelle recette',recipe_name:'Nom',servings:'Portions',sell_price:'Prix de vente (\u20ac)',
ingredients:'Ingr\u00e9dients',add_ingredient:'Ajouter ingr\u00e9dient',ingredient_name:'Nom',unit_price:'Prix (\u20ac)',
unit_size:'Taille (ex. 5kg)',save:'Enregistrer',language:'Langue',ingredient_pantry:'Garde-manger',
cost_per_serving:'Par portion',total_cost:'Co\u00fbt total',profit_margin:'B\u00e9n\u00e9fice',
no_recipes:'Pas de recettes',no_recipes_desc:'Appuyez + pour calculer.'}
};
const SK='recipecalc_data';
let state={lang:'en',recipes:[],pantry:[]};
let editingId=null;

function load(){try{const r=localStorage.getItem(SK);if(r)state={...state,...JSON.parse(r)};}catch(e){}}
function save(){try{localStorage.setItem(SK,JSON.stringify(state));}catch(e){}}
function t(k){return(i18n[state.lang]&&i18n[state.lang][k])||i18n.en[k]||k;}
function applyI18n(){document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.getAttribute('data-i18n')));}
function genId(){return'r'+Date.now().toString(36);}

function render(){
    const list=document.getElementById('recipeList');
    if(state.recipes.length===0){
        list.innerHTML=`<div class="empty-state"><div class="empty-icon">&#127859;</div><p>${t('no_recipes_desc')}</p></div>`;
    }else{
        list.innerHTML='';
        state.recipes.forEach(r=>{
            const card=document.createElement('div');
            card.className='recipe-card';
            const totalCost=calcTotal(r);
            const perServing=r.servings>0?totalCost/r.servings:0;
            let profitHTML='';
            if(r.sellPrice>0){
                const profit=((r.sellPrice-perServing)/r.sellPrice*100);
                const cls=profit>=0?'positive':'negative';
                profitHTML=`<div class="recipe-profit ${cls}">${t('profit_margin')}: ${profit.toFixed(1)}%</div>`;
            }
            card.innerHTML=`
                <button class="recipe-delete" data-id="${r.id}">&times;</button>
                <div class="recipe-name">${r.name}</div>
                <div class="recipe-meta">${r.servings} servings &middot; ${r.ingredients.length} ingredients</div>
                <div class="recipe-cost">$${perServing.toFixed(2)} <small style="font-size:12px;font-weight:400;color:var(--text2)">${t('cost_per_serving')}</small></div>
                ${profitHTML}
            `;
            card.addEventListener('click',(e)=>{
                if(e.target.classList.contains('recipe-delete'))return;
                openEditRecipe(r.id);
            });
            card.querySelector('.recipe-delete').addEventListener('click',(e)=>{
                e.stopPropagation();
                state.recipes=state.recipes.filter(x=>x.id!==r.id);
                save();render();
            });
            list.appendChild(card);
        });
    }
    renderPantry();
}

function calcTotal(r){
    return r.ingredients.reduce((s,ing)=>s+(parseFloat(ing.cost)||0),0);
}

function renderPantry(){
    const list=document.getElementById('pantryList');
    list.innerHTML='';
    state.pantry.forEach((p,i)=>{
        list.innerHTML+=`<span class="pantry-chip">${p.name} ($${p.price})<button data-idx="${i}">&times;</button></span>`;
    });
    list.querySelectorAll('.pantry-chip button').forEach(btn=>{
        btn.addEventListener('click',()=>{
            state.pantry.splice(parseInt(btn.dataset.idx),1);
            save();renderPantry();
        });
    });
}

function openNewRecipe(){
    editingId=null;
    document.getElementById('recipeModalTitle').textContent=t('new_recipe');
    document.getElementById('inputRecipeName').value='';
    document.getElementById('inputServings').value='4';
    document.getElementById('inputSellPrice').value='';
    document.getElementById('ingredientRows').innerHTML='';
    addIngredientRow();
    updateCostSummary();
    document.getElementById('modalRecipe').style.display='flex';
}

function openEditRecipe(id){
    const r=state.recipes.find(x=>x.id===id);
    if(!r)return;
    editingId=id;
    document.getElementById('recipeModalTitle').textContent=r.name;
    document.getElementById('inputRecipeName').value=r.name;
    document.getElementById('inputServings').value=r.servings;
    document.getElementById('inputSellPrice').value=r.sellPrice||'';
    const rows=document.getElementById('ingredientRows');
    rows.innerHTML='';
    r.ingredients.forEach(ing=>addIngredientRow(ing.name,ing.cost));
    updateCostSummary();
    document.getElementById('modalRecipe').style.display='flex';
}

function addIngredientRow(name='',cost=''){
    const rows=document.getElementById('ingredientRows');
    const row=document.createElement('div');
    row.className='ing-row';
    row.innerHTML=`<input type="text" placeholder="${t('ingredient_name')}" value="${name}" class="ing-name">
    <input type="number" placeholder="$" step="0.01" min="0" value="${cost}" class="ing-cost" style="max-width:80px">
    <button>&times;</button>`;
    row.querySelector('button').addEventListener('click',()=>{row.remove();updateCostSummary();});
    row.querySelector('.ing-cost').addEventListener('input',updateCostSummary);
    rows.appendChild(row);
}

function updateCostSummary(){
    const rows=document.querySelectorAll('.ing-row');
    let total=0;
    rows.forEach(r=>{total+=parseFloat(r.querySelector('.ing-cost').value)||0;});
    const servings=parseInt(document.getElementById('inputServings').value)||1;
    const sellPrice=parseFloat(document.getElementById('inputSellPrice').value)||0;
    const perServing=total/servings;
    let profitLine='';
    if(sellPrice>0){
        const profit=((sellPrice-perServing)/sellPrice*100);
        profitLine=`<div class="cost-row"><span>${t('profit_margin')}</span><span>${profit.toFixed(1)}%</span></div>`;
    }
    document.getElementById('costSummary').innerHTML=`
        <div class="cost-row"><span>${t('total_cost')}</span><span>$${total.toFixed(2)}</span></div>
        <div class="cost-row total"><span>${t('cost_per_serving')}</span><span>$${perServing.toFixed(2)}</span></div>
        ${profitLine}
    `;
}

function saveRecipe(){
    const name=document.getElementById('inputRecipeName').value.trim();
    if(!name)return;
    const servings=parseInt(document.getElementById('inputServings').value)||1;
    const sellPrice=parseFloat(document.getElementById('inputSellPrice').value)||0;
    const ingredients=[];
    document.querySelectorAll('.ing-row').forEach(row=>{
        const n=row.querySelector('.ing-name').value.trim();
        const c=parseFloat(row.querySelector('.ing-cost').value)||0;
        if(n)ingredients.push({name:n,cost:c});
    });
    if(editingId){
        const idx=state.recipes.findIndex(r=>r.id===editingId);
        if(idx>=0)state.recipes[idx]={...state.recipes[idx],name,servings,sellPrice,ingredients};
    }else{
        state.recipes.push({id:genId(),name,servings,sellPrice,ingredients});
    }
    save();render();
    document.getElementById('modalRecipe').style.display='none';
}

function init(){
    load();applyI18n();render();
    document.getElementById('btnAddRecipe').addEventListener('click',openNewRecipe);
    document.getElementById('btnCloseRecipe').addEventListener('click',()=>document.getElementById('modalRecipe').style.display='none');
    document.getElementById('modalRecipe').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
    document.getElementById('btnAddIngredientRow').addEventListener('click',()=>addIngredientRow());
    document.getElementById('inputServings').addEventListener('input',updateCostSummary);
    document.getElementById('inputSellPrice').addEventListener('input',updateCostSummary);
    document.getElementById('btnSaveRecipe').addEventListener('click',saveRecipe);

    document.getElementById('btnAddIngredient').addEventListener('click',()=>{
        document.getElementById('inputPantryName').value='';
        document.getElementById('inputPantryPrice').value='';
        document.getElementById('inputPantryUnit').value='';
        document.getElementById('modalPantry').style.display='flex';
    });
    document.getElementById('btnClosePantry').addEventListener('click',()=>document.getElementById('modalPantry').style.display='none');
    document.getElementById('modalPantry').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
    document.getElementById('btnSavePantry').addEventListener('click',()=>{
        const name=document.getElementById('inputPantryName').value.trim();
        if(!name)return;
        state.pantry.push({name,price:document.getElementById('inputPantryPrice').value,unit:document.getElementById('inputPantryUnit').value});
        save();renderPantry();
        document.getElementById('modalPantry').style.display='none';
    });

    document.getElementById('btnLang').addEventListener('click',()=>document.getElementById('modalLang').style.display='flex');
    document.getElementById('btnCloseLang').addEventListener('click',()=>document.getElementById('modalLang').style.display='none');
    document.getElementById('modalLang').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';});
    document.querySelectorAll('.lang-btn').forEach(btn=>{
        btn.addEventListener('click',()=>{state.lang=btn.getAttribute('data-lang');save();applyI18n();render();document.getElementById('modalLang').style.display='none';});
    });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
