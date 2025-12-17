# 💰 Update EmailJS Template to PKR

## ⚠️ Important: Template Update Required

The code has been updated to send prices in PKR format (Rs. 1,200), but you need to update your EmailJS template to display them correctly.

---

## 🔧 Update Your EmailJS Template

### Current Template (USD):
```handlebars
${{price}}
${{cost.shipping}}
${{cost.tax}}
${{cost.total}}
```

### Updated Template (PKR):
```handlebars
{{price}}
{{cost.shipping}}
{{cost.tax}}
{{cost.total}}
```

**Note**: Remove the `$` symbol from your template because prices now come with "Rs." prefix already included.

---

## 📝 Step-by-Step Template Update

1. Go to [EmailJS Dashboard](https://dashboard.emailjs.com/)
2. Navigate to **Email Templates**
3. Open template `template_e7ha0k3`
4. Find all instances of `${{price}}`, `${{cost.shipping}}`, etc.
5. Remove the `$` symbol, leaving just `{{price}}`, `{{cost.shipping}}`, etc.
6. Save the template

---

## ✅ What Changed in Code

- ✅ `formatPrice()` now returns "Rs. 1,200" format
- ✅ All prices include "Rs." prefix
- ✅ Numbers formatted with commas (1,200 instead of 1200)

---

## 📧 Example Output

After update, emails will show:
- **Price**: `Rs. 1,200` (instead of `$1200`)
- **Shipping**: `Rs. 249` (instead of `$249`)
- **Total**: `Rs. 1,449` (instead of `$1449`)

---

## 🧪 Testing

1. Update your EmailJS template (remove `$` symbols)
2. Place a test order
3. Check email - prices should show as "Rs. 1,200" format

---

## 📋 Template Variables Reference

| Variable | Format | Example |
|----------|--------|---------|
| `{{price}}` | Rs. 1,200 | Already includes "Rs." |
| `{{cost.shipping}}` | Rs. 249 | Already includes "Rs." |
| `{{cost.tax}}` | Rs. 0 | Already includes "Rs." |
| `{{cost.total}}` | Rs. 1,449 | Already includes "Rs." |

**Important**: Don't add `$` or `Rs.` in template - it's already included in the value!

