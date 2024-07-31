## Link component

To make the redirections we have to see if it is in the same application or in another application, depending on that it is necessary to make a type of redirection or another
So this component was created to simplify the implementation and to be able to control everything in one place.

The component needs as props the `appId` to go to and the `path` to navigate to. The component itself will know in which application it is located in order to display its respective link.

#### Same application

In this case we have to navigate with the React Router because the application does not recognise that we are navigating and does not navigate using the Opensearch Dashboard navigation.

```tsx
<EuiLink
  {...otherProps}
  onClick={() => {
    NavigationService.getInstance().navigate(path);
  }}
>
  {children}
</EuiLink>
```

#### Diferent application

When navigating between applications you can use Opensearch Dashboard navigation and have the path you are going to navigate to when you are over the link.

```tsx
<RedirectAppLinks application={getCore().application}>
  <EuiLink
    {...otherProps}
    href={NavigationService.getInstance().getUrlForApp(appId, {
      path: `#${path}`,
    })}
  >
    {children}
  </EuiLink>
</RedirectAppLinks>
```

#### With tooltip

If the component receives the `toolTipProps` object as a prop, then it wraps the link with a tooltip component.

### Implementation

```tsx
  <WzLink
    appId={<Application-to-go-to>}
    path={<Path-to-navigate-to>}
    toolTipProps={{content: 'This is a tooltip'}} //Optional prop
    otherPropsForTheEuiLink
  >
    whatever you want to render in the link
  </WzLink>
```
