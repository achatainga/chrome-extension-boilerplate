var helpers = chrome.extension.getBackgroundPage();
initialize();
function initialize() {
    $( document ).ready( function() {
        chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
            var currentTab = tabs[ 0 ];
            var parsed = psl.parse( currentTab.url );
            console.log( parsed );
            console.log( 'https://couponifier.com/ext_store.php?link=' + parsed.domain );
            $( '#couponifier_iframe' ).attr( 'src', 'https://couponifier.com/ext_store.php?link=' + parsed.domain );
            // chrome.runtime.sendMessage( { host: helpers.extractHostname( currentTab.url ), action: "get_data_from_api" }, async function( response ) {
                
            //     handle_load();
            // } );
        } );
    } );
}


function handle_load() {
    $( document ).ready( function() {
        document.getElementById( 'body' ).style.minWidth = "450px";
        $( "#loader" ).remove();
        $( ".deal_code" ).on( "click", function() {
            var element = $( this );
            var deal_code = $( this ).attr( "deal_code" );
            copyTextToClipboard( $( this ).attr( "deal_code" ) );
            $( this ).html( "Copied" );
            setTimeout( function(){ element.html( deal_code ) }, 3000 );
        } )
        $( ".link" ).on( "click", function() {
            window.open( $( this ).attr( "href" ) );
        } );
    } );
    
    $( "#store_follow_after" ).on( "click", { callback: "store_follow_after" }, on_click_process );
    $( "#store_alert_after" ).on( "click", { callback: "store_alert_after" }, on_click_process );
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

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}

var on_click_process = async ( event, callback = undefined ) => {
    event.preventDefault();
    var element = $( event.currentTarget )[ 0 ];
    var prefix  = $( element ).attr( "prefix" );
    var url     = $( element ).attr( "url" );
    chrome.storage.local.get( "token", async function( token ) {
        var token = ( !helpers.nullOrundefined( token.token ) && !helpers.isEmpty( token ) ) ? token.token : {};
        if ( !helpers.isEmpty( token ) ) {
            $( element ).attr( prefix + "token", token );
        }
        var data        = build_data_params( element.attributes, prefix );
        var response    = await helpers.make_post( url, data );
        if ( event.data.callback != undefined ) {
            var call = event.data.callback;
            window[ call ]( element, response );
        }
    } );
}

var build_data_params = ( attributes, prefix ) => {
    var regex = new RegExp( prefix );
    var data = new FormData();
    $.each( attributes, function() {
        // https://stackoverflow.com/questions/14645806/get-all-attributes-of-an-element-using-jquery
        if( this.specified && this.name.match( regex ) ) {
            data.append( this.name.replace( regex, "" ), this.value );
        }
    } );
    return data;
}

var store_alert_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now active!", "success" );
        } else {
            var color = "#6c757d";
            print_flash( "Alerts for " + $( element ).attr( "stor_name" ) + " are now inactive.", "info" );
        }
        $( element ).css( { color: color } );
    } else {
        print_flash( "Make sure you are logged int at couponifier.com first", "error" );
    }
}

var store_follow_after = ( element, response ) => {
    if ( response.hasOwnProperty( "success" ) && typeof response.success !==  "undefined" ) {
        if ( response.success.general == "active" ) {
            var color = "#007bff";
            print_flash( "You are now following " + $( element ).attr( "stor_name" ), "success" );
        } else {
            var color = "#6c757d";
            print_flash( "You are no longer following " + $( element ).attr( "stor_name" ), "info" );
        }
        $( element ).css( { color: color } );
    } else {
        print_flash( "Make sure you are logged int at couponifier.com first", "error" );
    }
}