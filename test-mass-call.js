// Testi /api/mass-call endpointille
// Käytä: node test-mass-call.js

const fetch = require('node-fetch')

async function testMassCall() {
  console.log('🧪 Testataan /api/mass-call endpoint...\n')
  
  const testData = {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    callType: 'test-call-type',
    script: 'Hei! Tämä on testi puhelu Rascal AI:sta.',
    voice: 'rascal-mies-1',
    companyId: 'test-company-123'
  }
  
  try {
    console.log('📤 Lähetetään testidata:')
    console.log(JSON.stringify(testData, null, 2))
    console.log('\n')
    
    const response = await fetch('http://localhost:3000/api/mass-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    console.log(`📥 Vastaus: ${response.status} ${response.statusText}`)
    
    const result = await response.json()
    console.log('\n📋 Vastauksen sisältö:')
    console.log(JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('\n✅ Testi onnistui!')
      console.log(`📊 Puheluita lisätty: ${result.totalCalls}`)
      console.log(`🆔 Sheet ID: ${result.sheetId}`)
      console.log(`🕒 Aika: ${result.timestamp}`)
    } else {
      console.log('\n❌ Testi epäonnistui!')
      console.log(`Virhe: ${result.error}`)
      if (result.details) {
        console.log(`Yksityiskohdat: ${result.details}`)
      }
    }
    
  } catch (error) {
    console.error('\n💥 Testi epäonnistui poikkeuksella:')
    console.error(error.message)
  }
}

// Suorita testi
testMassCall() 