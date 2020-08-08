var helpers = chrome.extension.getBackgroundPage();
initialize();
function initialize() {
    window.addEventListener( "load", () => {
        chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
            var currentTab = tabs[ 0 ];
            var parsed = psl.parse( helpers.extractHostname( currentTab.url ) );
            var couponifier_iframe = document.getElementById( 'couponifier_iframe' );
            couponifier_iframe.setAttribute( 'src', 'https://couponifier.com/ext_store.php?link=' + parsed.domain + '&header_no=true&footer_no=true' );
        } );
    } );
}