var helpers = chrome.extension.getBackgroundPage();
initialize();
function initialize() {
    $( document ).ready( function() {
        chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
            var currentTab = tabs[ 0 ];
            var parsed = psl.parse( helpers.extractHostname( currentTab.url ) );
            $( '#couponifier_iframe' ).attr( 'src', 'https://45.230.168.50/ext_store.php?link=' + parsed.domain + '&header_no=true&footer_no=true' );
        } );
    } );
}

var print_flash = ( message, type ) => {
    var flash = $( "#flash" );
    if ( flash.length > 0 ) {
        flash.remove();
    }
    var types = {
        'success': 'success',
        'error': 'danger',
        'danger': 'danger',
        'info': 'info',
        'primary': 'info',
        'secondary': 'warning',
        'warning': 'warning',
        'default': 'primary'
    }
    var xxx = 
    ( type == "success" ? `success` : 
        ( type == "info" ? `info`: 
            ( type == "warning" ? "warning" : "" )
        )
    )
    var html =
    `
    <div id="flash">
        <div class="flash alert alert-`
            + ( types[ type ] || types[ 'default' ] )+ ` alert-dismissible fade show mt-1" role="alert"
            style="
                position: fixed;
                right: 0px;
                display: none;
                z-index: 1
            "
        >
            <strong>
            </strong> ` + message + `
        </div>
    </div>
    `;
    $( html ).insertAfter( "header" );
    flash = $( ".flash" );
    var header_height = $( "header" ).height();
    var scrollTop = window.pageYOffset;
    var initialWidth = $( document ).outerWidth();
    $( flash ).css( { "margin-right": -initialWidth, top: ( scrollTop == 0 ? header_height : 0 )} )
    $( flash ).show();
    $( flash ).animate( { "margin-right": 0 } ,'fast' );
    var element = $( flash );
    setTimeout( function() {
        $( element ).animate( { "margin-right": -5000 } ,'fast' );
    }, 3000);
    setTimeout( function() {
        $( element ).parent().remove();
    }, 3200);
}