from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, date

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sku_df = pd.read_parquet('../sku_spend_all.par')
top_skus = sku_df[sku_df['cum_pct'] <= 0.80].copy()
top_skus['item_lower'] = top_skus['item'].str.lower()

spend_df = pd.read_parquet('../indirect_spends_fy23_to_fy25.par')

def parse_vendor_string(vendor_str: str) -> dict:
    """
    Parse vendor string to extract vendor code and name.
    Expected format: "VENDOR_CODE    VENDOR_NAME" (separated by 4 spaces)
    
    Returns:
        dict with 'vendor_code' and 'vendor_name' keys
    """
    if pd.isna(vendor_str) or not vendor_str:
        return {'vendor_code': '', 'vendor_name': ''}
    
    parts = str(vendor_str).split('    ')
    vendor_code = parts[0].strip() if parts else ''
    vendor_name = ' '.join(parts[1:]).strip() if len(parts) > 1 else vendor_str
    
    return {
        'vendor_code': vendor_code,
        'vendor_name': vendor_name
    }

def calculate_time_ago(purchase_date_str):
    """
    Calculate years, months, and days between purchase date and today.
    
    Returns:
        dict with 'years', 'months', 'days' keys, or None if date is invalid
    """
    if not purchase_date_str:
        return None
    
    try:
        # Parse the date string
        if isinstance(purchase_date_str, str):
            purchase_date = datetime.strptime(purchase_date_str, '%Y-%m-%d').date()
        elif isinstance(purchase_date_str, pd.Timestamp):
            purchase_date = purchase_date_str.date()
        elif isinstance(purchase_date_str, date):
            purchase_date = purchase_date_str
        else:
            return None
        
        today = date.today()
        
        # Start with years
        years = today.year - purchase_date.year
        
        # Calculate months
        months = today.month - purchase_date.month
        if months < 0:
            years -= 1
            months += 12
        
        # If we haven't reached the same day in the current month, subtract a month
        if today.day < purchase_date.day:
            months -= 1
            if months < 0:
                years -= 1
                months += 12
        
        # Calculate days
        # Create a reference date by adding years and months to purchase_date
        ref_year = purchase_date.year + years
        ref_month = purchase_date.month + months
        if ref_month > 12:
            ref_year += 1
            ref_month -= 12
        
        # Try to create a date with the same day as purchase_date
        try:
            ref_date = date(ref_year, ref_month, purchase_date.day)
        except ValueError:
            # Handle case where day doesn't exist in target month (e.g., Feb 30)
            # Use last day of the month
            if ref_month == 2:
                # February
                if ref_year % 4 == 0 and (ref_year % 100 != 0 or ref_year % 400 == 0):
                    ref_date = date(ref_year, ref_month, 29)
                else:
                    ref_date = date(ref_year, ref_month, 28)
            elif ref_month in [4, 6, 9, 11]:
                ref_date = date(ref_year, ref_month, 30)
            else:
                ref_date = date(ref_year, ref_month, 31)
        
        days = (today - ref_date).days
        
        # Adjust if days is negative (shouldn't happen, but just in case)
        if days < 0:
            months -= 1
            if months < 0:
                years -= 1
                months += 12
            # Recalculate ref_date
            ref_year = purchase_date.year + years
            ref_month = purchase_date.month + months
            if ref_month > 12:
                ref_year += 1
                ref_month -= 12
            try:
                ref_date = date(ref_year, ref_month, purchase_date.day)
            except ValueError:
                if ref_month == 2:
                    if ref_year % 4 == 0 and (ref_year % 100 != 0 or ref_year % 400 == 0):
                        ref_date = date(ref_year, ref_month, 29)
                    else:
                        ref_date = date(ref_year, ref_month, 28)
                elif ref_month in [4, 6, 9, 11]:
                    ref_date = date(ref_year, ref_month, 30)
                else:
                    ref_date = date(ref_year, ref_month, 31)
            days = (today - ref_date).days
        
        return {
            'years': years,
            'months': months
        }
    except (ValueError, AttributeError, TypeError):
        return None

@app.get("/search")
def search_skus(q: str = ""):
    if not q:
        return []
    
    q_lower = q.lower()
    matches = top_skus[top_skus['item_lower'].str.contains(q_lower, na=False, regex=False)]
    
    return matches[['item', 'spend_in_inr', 'cum_pct']].head(20).to_dict('records')

@app.get("/vendors")
def get_vendors(sku: str = ""):
    if not sku:
        return []
    
    sku_lower = sku.lower()
    filtered = spend_df[spend_df['sku_short_text'].str.lower().str.contains(sku_lower, na=False, regex=False)]
    
    # Calculate total spend per vendor
    vendor_spend = filtered.groupby('vendor_std')['spend_in_inr'].sum().reset_index()
    vendor_spend = vendor_spend.sort_values('spend_in_inr', ascending=False)
    vendor_spend.columns = ['vendor', 'total_spend']
    
    # Parse vendor strings to extract code and name
    parsed_vendors = vendor_spend['vendor'].apply(parse_vendor_string)
    vendor_spend['vendor_code'] = parsed_vendors.apply(lambda x: x['vendor_code'])
    vendor_spend['vendor_name'] = parsed_vendors.apply(lambda x: x['vendor_name'])
    
    # Calculate last purchase date and amount for each vendor
    def get_last_purchase_info(vendor_str):
        vendor_transactions = filtered[filtered['vendor_std'] == vendor_str]
        if vendor_transactions.empty:
            return {'date': None, 'amount': None, 'time_ago': None}
        
        # Sort by po_creation_date descending to get the most recent
        vendor_transactions = vendor_transactions.sort_values('po_creation_date', ascending=False)
        last_transaction = vendor_transactions.iloc[0]
        
        last_date = last_transaction['po_creation_date']
        last_amount = last_transaction['spend_in_inr']
        
        # Convert date to string if it's a datetime object
        if pd.notna(last_date):
            if isinstance(last_date, pd.Timestamp):
                last_date_str = last_date.strftime('%Y-%m-%d')
            else:
                last_date_str = str(last_date)
        else:
            last_date_str = None
        
        # Calculate time ago
        time_ago = calculate_time_ago(last_date_str) if last_date_str else None
        
        return {
            'date': last_date_str,
            'amount': float(last_amount) if pd.notna(last_amount) else None,
            'time_ago': time_ago
        }
    
    purchase_info = vendor_spend['vendor'].apply(get_last_purchase_info)
    vendor_spend['last_purchase_date'] = purchase_info.apply(lambda x: x['date'])
    vendor_spend['last_purchase_amount'] = purchase_info.apply(lambda x: x['amount'])
    vendor_spend['last_purchase_time_ago'] = purchase_info.apply(lambda x: x['time_ago'])
    
    # Return with parsed fields (keeping original vendor for backwards compatibility if needed)
    return vendor_spend.head(50).to_dict('records')

