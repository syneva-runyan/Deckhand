<script setup>
// Terms and Privacy. Plain words, and only what the prototype really does.
defineProps({ doc: { type: String, required: true } });
const updated = 'October 4, 2026';
</script>

<template>
  <div class="page legal">
    <main class="legal__body">
      <p class="legal__back"><a href="/">Deckhand</a></p>

      <template v-if="doc === 'terms'">
        <h1>Terms</h1>
        <p class="legal__date">Last updated {{ updated }}</p>

        <h2>What Deckhand is</h2>
        <p>Deckhand is a prototype for independent fishermen who sell direct. It builds a storefront, shows incoming orders and tells the seller when an order arrives. Off the Rock is a sample store. Its checkout takes no payment and nothing is shipped, so please do not type a real card number into it.</p>

        <h2>Deckhand order alerts (text messages)</h2>
        <p>If you save a mobile number on the My orders page, Deckhand texts that number each time someone orders from your business. Each text gives the order details and a link to print the shipping label.</p>
        <ul>
          <li>You get a confirmation text when you save your number, then one text for each order, so how many you get depends on your orders.</li>
          <li>Message and data rates may apply.</li>
          <li>Reply STOP to stop the texts. Reply HELP for help.</li>
          <li>The texts also stop when you close your browser or remove your number on the My orders page.</li>
          <li>You do not have to sign up for texts to use Deckhand.</li>
          <li>Mobile carriers are not liable for delayed or undelivered messages.</li>
        </ul>
        <p>How we handle your number is set out in the <a href="/privacy">Privacy</a> page.</p>

        <h2>Using Deckhand</h2>
        <p>Deckhand is offered as it is, with no warranty. It is a prototype, so pages and data can change or be cleared at any time. Only enter information you have the right to share.</p>

        <h2>Changes</h2>
        <p>If these terms change, the new version will be posted on this page with a new date.</p>
      </template>

      <template v-else>
        <h1>Privacy</h1>
        <p class="legal__date">Last updated {{ updated }}</p>

        <h2>Your mobile number</h2>
        <p>If you save a mobile number on the My orders page, we use it only to text you about orders placed on Off the Rock while Deckhand is open in your browser. We do not write it to our database. Your browser holds it until you close the browser, and our server drops it when you close the page or remove the number, and at the latest five minutes after your browser was last open.</p>
        <p>We do not share mobile numbers or text messaging consent with third parties or affiliates for marketing or promotional purposes. The texts are delivered by Twilio, which keeps its own delivery records, including the number a text was sent to.</p>

        <h2>Orders</h2>
        <p>When someone orders from a store, we keep the name and email they entered and what they ordered, so the seller can see and fill the order. The seller can remove an order from the My orders page. Card details typed into the sample checkout are not sent to us or stored.</p>

        <h2>What stays in your browser</h2>
        <p>Your inventory, brand answers, boat details and notes on the dashboard are saved in your own browser and are not sent to our server.</p>

        <h2>Other services</h2>
        <p>Pages load their fonts from Google Fonts, which sees your IP address when it serves them. We do not sell personal information and we do not run advertising or analytics trackers.</p>

        <h2>Changes</h2>
        <p>If this page changes, the new version will be posted here with a new date.</p>
      </template>

      <p class="legal__foot"><a href="/terms">Terms</a> <a href="/privacy">Privacy</a></p>
    </main>
  </div>
</template>
