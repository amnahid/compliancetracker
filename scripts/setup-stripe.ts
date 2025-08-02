// Script to create the Healthcare Compliance product in Stripe
// Run this once to set up your Stripe products

const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function createStripeProduct() {
  try {
    console.log('🔄 Creating Healthcare Compliance Tracker product...');

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables');
    }

    // Create the product
    const product = await stripe.products.create({
      name: 'Healthcare Compliance Tracker',
      description: 'Complete compliance tracking solution for healthcare practices',
      metadata: {
        plan: 'healthcare_compliance',
      },
    });

    console.log('✅ Product created:', product.id);

    // Create the price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 4900, // $49.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan: 'healthcare_compliance',
      },
    });

    console.log('✅ Price created:', price.id);
    console.log('\n🎉 Success! Update your lib/stripe.ts with this price ID:');
    console.log(`healthcare_compliance: '${price.id}',`);
    console.log('\nCopy this line and replace the existing one in lib/stripe.ts');

    return { product, price };
  } catch (error: any) {
    console.error('❌ Error creating Stripe product:', error.message);
    throw error;
  }
}

// Run the script
createStripeProduct()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });
