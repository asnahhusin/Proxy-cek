export function onRequest({request}) {
  // Get geolocation information
  const {geo, clientIp, uuid} = request.eo;

  // Build response data
  const responseData = {
    geo: {
      asn: geo?.asn ?? 0,
      countryName: geo?.countryName ?? "Unknown",
      countryCodeAlpha2: geo?.countryCodeAlpha2 ?? "N/A",
      countryCodeAlpha3: geo?.countryCodeAlpha3 ?? "N/A",
      countryCodeNumeric: geo?.countryCodeNumeric ?? "N/A",
      regionName: geo?.regionName ?? "Unknown",
      regionCode: geo?.regionCode ?? "N/A",
      cityName: geo?.cityName ?? "Unknown",
      latitude: geo?.latitude ?? 0,
      longitude: geo?.longitude ?? 0,
      cisp: geo?.cisp ?? "Unknown"
    },
    clientIp: clientIp ?? "Unknown",
    uuid: uuid ?? "Unknown"
  };

  // Return JSON response
  return new Response(JSON.stringify(responseData, null, 2), {
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    },
  });
}
