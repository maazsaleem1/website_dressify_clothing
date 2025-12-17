# 🔧 Update EmailJS Template - Remove $ and Add Rs.

## ⚠️ IMPORTANT: You Must Update Your EmailJS Template

Your email is still showing **"$3000"** because your EmailJS template has `${{price}}` in it.

---

## 📝 Step-by-Step Instructions

### 1. Go to EmailJS Dashboard
1. Visit: https://dashboard.emailjs.com/
2. Login to your account
3. Click on **"Email Templates"** in the left menu
4. Find and click on template: **`template_e7ha0k3`**

### 2. Find All Price Variables

Search for these in your template:
- `${{price}}`
- `${{cost.shipping}}`
- `${{cost.tax}}`
- `${{cost.total}}`

### 3. Replace Them

**FIND:**
```handlebars
${{price}}
${{cost.shipping}}
${{cost.tax}}
${{cost.total}}
```

**REPLACE WITH:**
```handlebars
Rs. {{price}}
Rs. {{cost.shipping}}
Rs. {{cost.tax}}
Rs. {{cost.total}}
```

### 4. Save Template
Click the **"Save"** button at the top of the EmailJS editor.

---

## 📋 Complete Example

Here's how your pricing section should look in the template:

```html
<!-- Product Price -->
<strong>Rs. {{price}}</strong>

<!-- Cost Summary -->
<table>
  <tr>
    <td>Shipping</td>
    <td>Rs. {{cost.shipping}}</td>
  </tr>
  <tr>
    <td>Taxes</td>
    <td>Rs. {{cost.tax}}</td>
  </tr>
  <tr>
    <td><strong>Order Total</strong></td>
    <td><strong>Rs. {{cost.total}}</strong></td>
  </tr>
</table>
```

---

## ✅ What the Code Sends

- **Price**: `3,000` (formatted with commas)
- **Shipping**: `249`
- **Tax**: `0`
- **Total**: `3,249`

**Template should display:** `Rs. 3,000` (not `$3000`)

---

## 🎯 Quick Checklist

- [ ] Open EmailJS template `template_e7ha0k3`
- [ ] Find `${{price}}` → Change to `Rs. {{price}}`
- [ ] Find `${{cost.shipping}}` → Change to `Rs. {{cost.shipping}}`
- [ ] Find `${{cost.tax}}` → Change to `Rs. {{cost.tax}}`
- [ ] Find `${{cost.total}}` → Change to `Rs. {{cost.total}}`
- [ ] Save template
- [ ] Test with a new order

---

## 📧 Expected Result

After updating template:
- ✅ Price: `Rs. 3,000` (not `$3000`)
- ✅ Shipping: `Rs. 249` (not `$249`)
- ✅ Tax: `Rs. 0` (not `$0`)
- ✅ Total: `Rs. 3,249` (not `$3249`)

---

## ⚠️ Important Notes

1. **Remove ALL `$` symbols** from price variables
2. **Add `Rs.` before** each price variable
3. **Keep the spaces** - `Rs. {{price}}` (not `Rs.{{price}}`)
4. **Save the template** after making changes

---

## 🆘 Still Not Working?

If you still see "$" after updating:
1. Clear browser cache
2. Check template is saved correctly
3. Place a new test order
4. Check browser console for email parameters log

The code is ready - you just need to update the EmailJS template! 🚀

