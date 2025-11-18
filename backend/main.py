from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sku_df = pd.read_parquet('../sku_spend_all.par')
top_skus = sku_df[sku_df['cum_pct'] <= 0.90].copy()
top_skus['item_lower'] = top_skus['item'].str.lower()

spend_df = pd.read_parquet('../indirect_spends_fy23_to_fy25.par')

@app.get("/search")
def search_skus(q: str = ""):
    if not q:
        return []
    
    q_lower = q.lower()
    matches = top_skus[top_skus['item_lower'].str.contains(q_lower, na=False)]
    
    return matches[['item', 'spend_in_inr', 'cum_pct']].head(20).to_dict('records')

@app.get("/vendors")
def get_vendors(sku: str = ""):
    if not sku:
        return []
    
    sku_lower = sku.lower()
    filtered = spend_df[spend_df['sku_short_text'].str.lower().str.contains(sku_lower, na=False)]
    
    vendor_spend = filtered.groupby('vendor_std')['spend_in_inr'].sum().reset_index()
    vendor_spend = vendor_spend.sort_values('spend_in_inr', ascending=False)
    vendor_spend.columns = ['vendor', 'total_spend']
    
    return vendor_spend.head(50).to_dict('records')

