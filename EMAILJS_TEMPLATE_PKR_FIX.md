# 🔧 Fix EmailJS Template for PKR Currency

## ⚠️ Current Issue

You're seeing **"$Rs. 1,200"** because:
- Code sends: `1200` (number only)
- Template has: `${{price}}` (adds $ symbol)
- Result: `$1200` but you want `Rs. 1,200`

---

## ✅ Solution: Update Your EmailJS Template

### Step 1: Go to EmailJS Dashboard
1. Visit [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Login to your account
3. Go to **Email Templates**
4. Open template: `template_e7ha0k3`

### Step 2: Find and Replace

**Find these in your template:**
```handlebars
${{price}}
${{cost.shipping}}
${{cost.tax}}
${{cost.total}}
```

**Replace with:**
```handlebars
Rs. {{price}}
Rs. {{cost.shipping}}
Rs. {{cost.tax}}
Rs. {{cost.total}}
```

### Step 3: Save Template
Click **Save** button in EmailJS dashboard

---

## 📝 Complete Template Example

Here's how your pricing section should look:

```handlebars
{{#orders}}
  <table>
    <tr>
      <td><img src="{{image_url}}" alt="{{name}}" /></td>
      <td>
        <div>{{name}}</div>
        <div>QTY: {{units}}</div>
      </td>
      <td><strong>Rs. {{price}}</strong></td>
    </tr>
  </table>
{{/orders}}

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

## ✅ What Changed in Code

- ✅ `formatPrice()` now returns **numbers only** (1200, not "Rs. 1,200")
- ✅ Template needs to add "Rs." prefix
- ✅ This prevents "$Rs." issue

---

## 🧪 Testing

1. Update EmailJS template (remove `$`, add `Rs.`)
2. Place a test order
3. Check email - should show "Rs. 1,200" (not "$Rs. 1,200")

---

## 📋 Quick Reference

| Template Variable | Current (Wrong) | Should Be (Correct) |
|-------------------|----------------|----------------------|
| Price | `${{price}}` | `Rs. {{price}}` |
| Shipping | `${{cost.shipping}}` | `Rs. {{cost.shipping}}` |
| Tax | `${{cost.tax}}` | `Rs. {{cost.tax}}` |
| Total | `${{cost.total}}` | `Rs. {{cost.total}}` |

---

## 🎯 Summary

**Code sends:** `1200` (number)
**Template should display:** `Rs. 1200`
**Template should NOT have:** `${{price}}` (this causes "$Rs.")

**Fix:** Change `${{price}}` to `Rs. {{price}}` in your EmailJS template!

