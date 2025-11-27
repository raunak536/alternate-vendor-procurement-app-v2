from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from datetime import datetime, date
import re

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

# Parent Company to Country Mapping
PARENT_COMPANY_COUNTRY_MAPPING = {
    # Major biopharma companies
    'mylan': 'usa',
    'viatris': 'usa',
    'lupin': 'india',
    'fujifilm kyowa kirin': 'japan',
    'fujifilm': 'japan',
    'kyowa kirin': 'japan',
    'anderson brecon': 'uk',
    'andersonbrecon': 'uk',
    'genomic scientific': 'usa',
    'genetix biotech': 'usa',
    'mckesson': 'usa',
    'bioton': 'poland',
    'bcil': 'india',
    'accuristix': 'usa',
    'espee biopharma': 'india',
    'invitrogen bioservices': 'usa',
    'eris lifesciences': 'india',
    'cencora': 'usa',
    'bgp products': 'italy',
    'value point systems': 'usa',
    'centre specialites pharm': 'france',
    'bmclinical': 'netherlands',
    'aenorasis': 'spain',
    'prespack': 'poland',
    'eurofins discoverx': 'usa',
    'avosano industrie': 'germany',
    'rvr enterprises': 'india',
    'nomeco': 'denmark',
    'millmount healthcare': 'ireland',
    'celerion': 'usa',
    'hp india': 'india',
    'famar': 'greece',
    'wns global services': 'india',
    'loxxess pharma': 'germany',
    'wuxi biologics': 'china',
    'federal compliance solut': 'usa',
    'specialty electronic mat': 'usa',
    'merge west': 'usa',
    'integrated business syst': 'usa',
    'jt autolease': 'uk',
    'element fleet': 'canada',
    'depo-packs': 'italy',
    'taylor wessing': 'uk',
    'g-net technologies': 'india',
    'sonexus health access': 'usa',
    'sigma aldrich': 'usa',
    'ikris pharma': 'india',
    'fisher clinical services': 'usa',
    'sandoz': 'switzerland',
    'globyz pharma': 'india',
    'infosys': 'india',
    'koerber pharma': 'germany',
    'aon consulting': 'uk',
    'van mossel autolease': 'netherlands',
    'cardinal health': 'usa',
    'ernst & young': 'uk',
    'ernst young': 'uk',
    'advantage point solution': 'usa',
    'dxc technology': 'usa',
    'covermymeds': 'usa',
    'patheon manufacturing': 'usa',
    'lambda therapeutic resea': 'india',
    'acs pharmaprotect': 'uk',
    'beacon secretari': 'uk',
    'veeva systems': 'usa',
    'contora': 'usa',
    'crowell & moring': 'usa',
    'ppd development': 'usa',
    'goodwin procter': 'usa',
    'grant thornton': 'uk',
    'integrichain': 'usa',
    'sartorius stedim bioouts': 'germany',
    'catalent pharma solution': 'usa',
    'becton dickinson': 'usa',
    'almac clinical services': 'uk',
    'alcura health espana': 'spain',
    'deloitte': 'uk',
    'cognizant technology sol': 'usa',
    'pricewaterhousecoopers': 'uk',
    'united drug distributors': 'ireland',
    'laboratorios pisa': 'mexico',
    'zelle biotechnology': 'usa',
    'microbee life science': 'india',
    'shell spark': 'uk',
    'ald autoleasing': 'germany',
    # Pharmaceutical distributors and logistics
    'alloga': 'switzerland',
    'tamro': 'finland',
    'phoenix': 'germany',
    'iqvia': 'usa',
    # Additional major pharma companies
    'pfizer': 'usa',
    'roche': 'switzerland',
    'novartis': 'switzerland',
    'sanofi': 'france',
    'glaxosmithkline': 'uk',
    'gsk': 'uk',
    'astrazeneca': 'uk',
    'merck': 'usa',
    'johnson & johnson': 'usa',
    'bayer': 'germany',
    'takeda': 'japan',
    'gilead': 'usa',
    'amgen': 'usa',
    'abbvie': 'usa',
    'bristol-myers squibb': 'usa',
    'eli lilly': 'usa',
    'biogen': 'usa',
    'regeneron': 'usa',
    'vertex': 'usa',
    'moderna': 'usa',
    'biontech': 'germany',
    'teva': 'israel',
    'novo nordisk': 'denmark',
    'boehringer ingelheim': 'germany',
    'ucb': 'belgium',
    'servier': 'france',
    'ipsen': 'france',
    'astellas': 'japan',
    'daiichi sankyo': 'japan',
    'eisai': 'japan',
    'otsuka': 'japan',
    'chugai': 'japan',
    'mitsubishi tanabe': 'japan',
    'sumitomo dainippon': 'japan',
    'cipla': 'india',
    'dr reddy': 'india',
    'sun pharma': 'india',
    'torrent pharma': 'india',
    'aurobindo': 'india',
    'glenmark': 'india',
    'zydus': 'india',
    'wockhardt': 'india',
    'piramal': 'india',
    'jubilant': 'india',
    'biocon': 'india',
    'serum institute': 'india',
    'bharat biotech': 'india',
    'lonza': 'switzerland',
    'csl': 'australia',
    'grifols': 'spain',
    'samsung biologics': 'south korea',
    'celltrion': 'south korea',
    'beigene': 'china',
    'wuxi apptec': 'china',
}

def extract_company_and_country(raw_name):
    """
    Extracts company name and country from a raw vendor name string.
    Uses parent company mapping as default when country is not detected.
    
    Args:
        raw_name: Raw vendor name as seen in parquet files (e.g., "mylan ire healthcare lim", 
                  "alloga(nederland) b v", "viatris healthcare gmbh")
    
    Returns:
        tuple: (company_name, country)
            - company_name: Cleaned company name (lowercase, legal suffixes removed)
            - country: Country name (lowercase) or None if not found
    """
    if pd.isnull(raw_name):
        return (None, None)
    
    s = str(raw_name).strip()
    
    # Remove leading IDs
    s = re.sub(r'^\d+\s+', '', s)
    
    # Lowercase
    s = s.lower()
    
    # Extract country from parentheses first
    paren_content = re.findall(r'\(([^)]+)\)', s)
    s_no_paren = re.sub(r'\([^)]+\)', '', s)
    
    # Country mapping patterns
    country_patterns = {
        r'\b(uk|united kingdom)\b': 'uk',
        r'\b(ire|ireland)\b': 'ireland',
        r'\b(österreich|austria)\b': 'austria',
        r'\b(espana|españa|spain)\b': 'spain',
        r'\b(nederland|netherlands|nl)\b': 'netherlands',
        r'\b(hellas|greece)\b': 'greece',
        r'\b(canada|ca)\b': 'canada',
        r'\b(switzerland|ch)\b': 'switzerland',
        r'\b(hong kong|hk)\b': 'hong kong',
        r'\b(india|in)\b': 'india',
        r'\b(usa|us|united states)\b': 'usa',
        r'\b(germany|de)\b': 'germany',
        r'\b(france|fr)\b': 'france',
        r'\b(italy|it)\b': 'italy',
        r'\b(mexico|mx)\b': 'mexico',
        r'\b(china|prc)\b': 'china',
        r'\b(poland|pl)\b': 'poland',
        r'\b(sweden|se)\b': 'sweden',
        r'\b(japan|jp)\b': 'japan',
        r'\b(australia|au)\b': 'australia',
        r'\b(belgium|be)\b': 'belgium',
        r'\b(brazil|br)\b': 'brazil',
        r'\b(hungary|hu)\b': 'hungary',
        r'\b(portugal|pt)\b': 'portugal',
        r'\b(denmark|dk)\b': 'denmark',
        r'\b(norway|no)\b': 'norway',
        r'\b(russia|ru)\b': 'russia',
        r'\b(finland|fi)\b': 'finland',
        r'\b(israel|il)\b': 'israel',
        r'\b(south korea|korea|kr)\b': 'south korea',
    }
    
    # Extract country from parentheses first
    extracted_country = None
    for part in paren_content:
        for pattern, country in country_patterns.items():
            if re.search(pattern, part, flags=re.IGNORECASE):
                extracted_country = country
                break
        if extracted_country:
            break
    
    # If not in parentheses, check main string
    if not extracted_country:
        for pattern, country in country_patterns.items():
            if re.search(pattern, s_no_paren, flags=re.IGNORECASE):
                extracted_country = country
                break
    
    # Clean company name: remove legal suffixes
    s = s_no_paren
    legal_suffixes = [
        r'\b(private|pvt)\b',
        r'\b(limited|ltd)\b',
        r'\b(llp|llc)\b',
        r'\b(b\.v\.|bv)\b',
        r'\b(s\.a\.|sa)\b',
        r'\b(inc|incorporated)\b',
        r'\b(plc|public limited company)\b',
        r'\b(gmbh)\b',
        r'\b(co\.|company)\b',
        r'\b(corp|corporation)\b',
        r'\b(ag|aktiengesellschaft)\b',
        r'\b(oy|oyj)\b',
        r'\b(sdn bhd)\b',
        r'\b(s\.l\.|sl)\b',
        r'\b(firm)\b',
        r'\b(spzoo|sp\.z\.o\.o\.)\b',
        r'\b(doo|d\.o\.o\.)\b',
        r'\b(srl|s\.r\.l\.)\b',
        r'\b(ou|oü)\b',
        r'\b(uab)\b',
        r'\b(sia)\b',
        r'\b(ab)\b',
        r'\b(eesti)\b',
    ]
    
    for pattern in legal_suffixes:
        s = re.sub(pattern, '', s)
    
    # Remove country mentions from company name (if found)
    if extracted_country:
        for pattern in country_patterns.keys():
            s = re.sub(pattern, '', s, flags=re.IGNORECASE)
        # Also remove the country value itself if it appears
        s = re.sub(re.escape(extracted_country), '', s, flags=re.IGNORECASE)
    
    # Remove connectors and clean up
    s = re.sub(r'\b(and|&|,)\b', ' ', s)
    s = re.sub(r'[.,]+$', '', s)
    s = re.sub(r'\s+', ' ', s)
    
    company_name = s.strip()
    
    # If country was not extracted, try to match company name to parent company mapping
    if not extracted_country and company_name:
        # Try exact match first
        if company_name in PARENT_COMPANY_COUNTRY_MAPPING:
            extracted_country = PARENT_COMPANY_COUNTRY_MAPPING[company_name]
        else:
            # Try partial matching - check if any key in mapping is contained in company name
            for parent_company, country in PARENT_COMPANY_COUNTRY_MAPPING.items():
                # Check if parent company name appears in cleaned company name
                if parent_company in company_name or company_name in parent_company:
                    # Additional check: ensure significant overlap
                    if len(parent_company) >= 3 and len(company_name) >= 3:
                        # Calculate overlap ratio
                        shorter = min(len(parent_company), len(company_name))
                        longer = max(len(parent_company), len(company_name))
                        overlap_ratio = shorter / longer if longer > 0 else 0
                        
                        # If at least 60% overlap or one is contained in the other
                        if overlap_ratio >= 0.6 or parent_company in company_name:
                            extracted_country = country
                            break
            
            # If still not found, try word-by-word matching
            if not extracted_country:
                company_words = set(company_name.split())
                for parent_company, country in PARENT_COMPANY_COUNTRY_MAPPING.items():
                    parent_words = set(parent_company.split())
                    # If at least 50% of words match
                    if len(company_words) > 0 and len(parent_words) > 0:
                        common_words = company_words.intersection(parent_words)
                        if len(common_words) >= min(2, len(parent_words) * 0.5):
                            extracted_country = country
                            break
    
    return (company_name if company_name else None, extracted_country)

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

def generate_risk_score(vendor_name, total_spend, last_purchase_date, country):
    """
    Generate mock risk score based on vendor characteristics.
    Risk score is a combination of relationship history, financials, and regulations.
    
    Returns:
        dict with 'overall_score' (0-100), 'category' (Low/Medium/High), and 'breakdown'
    """
    import random
    
    # Seed random based on vendor name for consistency
    random.seed(hash(vendor_name) % 1000)
    
    # Relationship History Score (0-100)
    # Based on purchase recency and frequency
    relationship_score = 70
    if last_purchase_date:
        try:
            if isinstance(last_purchase_date, str):
                last_date = datetime.strptime(last_purchase_date, '%Y-%m-%d').date()
            elif isinstance(last_purchase_date, pd.Timestamp):
                last_date = last_purchase_date.date()
            else:
                last_date = last_purchase_date
            
            days_ago = (date.today() - last_date).days
            if days_ago < 90:
                relationship_score = 85 + random.randint(0, 10)
            elif days_ago < 180:
                relationship_score = 70 + random.randint(0, 10)
            elif days_ago < 365:
                relationship_score = 55 + random.randint(0, 10)
            else:
                relationship_score = 40 + random.randint(0, 15)
        except:
            relationship_score = 60 + random.randint(0, 20)
    else:
        relationship_score = 45 + random.randint(0, 15)
    
    # Financials Score (0-100)
    # Based on spend amount (higher spend = more stable)
    financial_score = 60
    if total_spend > 50000000:  # > 5 Cr
        financial_score = 80 + random.randint(0, 15)
    elif total_spend > 20000000:  # > 2 Cr
        financial_score = 70 + random.randint(0, 15)
    elif total_spend > 10000000:  # > 1 Cr
        financial_score = 60 + random.randint(0, 15)
    else:
        financial_score = 50 + random.randint(0, 15)
    
    # Regulations Score (0-100)
    # Based on country and vendor characteristics
    regulatory_score = 70
    high_risk_countries = ['china', 'russia', 'brazil']
    medium_risk_countries = ['india', 'poland', 'mexico']
    
    if country:
        country_lower = country.lower()
        if country_lower in high_risk_countries:
            regulatory_score = 50 + random.randint(0, 15)
        elif country_lower in medium_risk_countries:
            regulatory_score = 65 + random.randint(0, 15)
        else:
            regulatory_score = 75 + random.randint(0, 15)
    else:
        regulatory_score = 60 + random.randint(0, 20)
    
    # Calculate weighted overall score
    # Relationship: 40%, Financials: 35%, Regulations: 25%
    overall_score = int(
        relationship_score * 0.40 +
        financial_score * 0.35 +
        regulatory_score * 0.25
    )
    
    # Determine category
    if overall_score >= 75:
        category = 'Low'
    elif overall_score >= 55:
        category = 'Medium'
    else:
        category = 'High'
    
    return {
        'overall_score': overall_score,
        'category': category,
        'breakdown': {
            'relationship_history': {
                'score': relationship_score,
                'weight': 40,
                'label': 'Relationship History'
            },
            'financials': {
                'score': financial_score,
                'weight': 35,
                'label': 'Financials'
            },
            'regulations': {
                'score': regulatory_score,
                'weight': 25,
                'label': 'Regulations & Compliance'
            }
        }
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
    
    # Extract normalized company name and country
    company_country = vendor_spend['vendor_name'].apply(extract_company_and_country)
    vendor_spend['company'] = company_country.apply(lambda x: x[0])
    vendor_spend['country'] = company_country.apply(lambda x: x[1])
    
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
    
    # Generate risk scores for each vendor
    def get_risk_score(row):
        return generate_risk_score(
            row['vendor_name'],
            row['total_spend'],
            row['last_purchase_date'],
            row['country']
        )
    
    risk_scores = vendor_spend.apply(get_risk_score, axis=1)
    vendor_spend['risk_score'] = risk_scores.apply(lambda x: x['overall_score'])
    vendor_spend['risk_category'] = risk_scores.apply(lambda x: x['category'])
    vendor_spend['risk_breakdown'] = risk_scores.apply(lambda x: x['breakdown'])
    
    # Return with parsed fields (keeping original vendor for backwards compatibility if needed)
    return vendor_spend.head(50).to_dict('records')